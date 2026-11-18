import { Injectable, Inject, forwardRef, OnModuleInit, Optional } from '@nestjs/common';
import { Server } from 'socket.io';
import {
    GameRoom,
    LobbyOptions,
    Player,
} from '../../interfaces/game.interface';
import { GameRoomState } from '../../interfaces/game.interface';
import { RoomQueryService } from './room-query.service';
import { RoomHelperService } from './room-helper.service';
import { UserService } from '../../../users/user.service';
import { RedisService } from '../../../redis/redis.service';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';

@Injectable()
export class RoomManagerService implements OnModuleInit {
    private server: Server | null = null;
    private rooms: GameRoom[] = [];

    constructor(
        private readonly roomQueryService: RoomQueryService,
        @Inject(forwardRef(() => RoomHelperService))
        private readonly roomHelperService: RoomHelperService,
        private userService: UserService,
        private readonly redisService: RedisService,
    ) {}

    async onModuleInit() {
        try {
            const restored = await this.redisService.getAllActiveRooms();
            if (restored && restored.length > 0) {
                this.rooms = restored.map((r) => ({
                    ...r,
                    players: r.players.map((p) => ({ ...p, isOnline: false })),
                }));
                for (const r of this.rooms) {
                    this.roomHelperService.scheduleRoomCleanup(r.id, 30000);
                }
                console.log('[RoomManagerService] Відновлено ' + restored.length + ' активних кімнат із Redis');
            }
        } catch (err) {
            console.warn('[RoomManagerService] Помилка відновлення кімнат із Redis:', err);
        }
    }

    setServer(server: Server) {
        this.server = server;
    }

    private hasActiveSocketInServer(userId: number): boolean {
        if (!this.server?.sockets?.sockets) return false;
        for (const [, s] of this.server.sockets.sockets) {
            if (s.data?.user?.id === userId && !s.disconnected) {
                return true;
            }
        }
        return false;
    }

    get allRooms(): GameRoom[] {
        return this.rooms;
    }

    get serverInfo(): Server | null {
        return this.server;
    }

    async syncRoom(room: GameRoom): Promise<void> {
        await this.redisService.saveRoom(room);
    }

    async createRoom(
        playerId: number,
        login: string,
        lobbyOptions: LobbyOptions,
    ): Promise<string> {
        const id = this.roomHelperService.generateRoomId();
        const shortCode = this.roomHelperService.generateShortCode();
        const affectedRooms = this.roomHelperService.removeUserFromOtherRooms(playerId);
        this.notifyRemovedFromOtherRooms(playerId, affectedRooms);
        const userInfo = await this.userService.getUserById(playerId);

        const newRoom: GameRoom = {
            id,
            shortCode,
            players: [{ 
                id: playerId, 
                login, 
                avatar: userInfo.avatar,
                isOnline: true,
                isPremium: userInfo.isPremium || false,
                customTitle: userInfo.customTitle || null,
                nameColor: userInfo.nameColor || null,
            }],
            lobbyOptions: {
                ...lobbyOptions,
                maxPlayers: Math.min(20, Math.max(2, Number(lobbyOptions?.maxPlayers) || 4)),
                roundDuration: Math.min(25, Math.max(5, Number(lobbyOptions?.roundDuration) || 25)),
                roundsCount: Math.min(
                    20,
                    Math.max(
                        1,
                        Number(lobbyOptions?.roundsCount) ||
                            (lobbyOptions?.gameMode === 'DUEL' ? 5 : 10),
                    ),
                ),
                gameMode:
                    lobbyOptions?.gameMode === 'HEARDLE' || lobbyOptions?.gameMode === 'DUEL'
                        ? lobbyOptions.gameMode
                        : 'CLASSIC',
                answerMode:
                    lobbyOptions?.answerMode === 'TYPE_IN'
                        ? 'TYPE_IN'
                        : 'MULTIPLE_CHOICE',
                allowAutoJoin: lobbyOptions?.publicLobby
                    ? Boolean(lobbyOptions?.allowAutoJoin)
                    : false,
            },
            leaderId: playerId,
            state: GameRoomState.ADDING,
        };
        this.rooms.push(newRoom);
        await this.redisService.saveRoom(newRoom);
        this.broadcastRoomsList();
        return id;
    }

    async getRoom(roomIdOrCode: string): Promise<GameRoom | null> {
        if (!roomIdOrCode) return null;
        const query = roomIdOrCode.trim();
        let room = this.roomHelperService.findRoom(query);
        if (!room) {
            const normalizeRestoredRoom = (restored: GameRoom): GameRoom => ({
                ...restored,
                players: restored.players.map((p) => ({
                    ...p,
                    isOnline: this.hasActiveSocketInServer(p.id),
                })),
            });

            // Check Redis fallback in case room was persisted or shortCode lookup
            const fromRedis = await this.redisService.getRoom(query);
            if (fromRedis) {
                const normalized = normalizeRestoredRoom(fromRedis);
                if (!this.rooms.some((r) => r.id === normalized.id)) {
                    this.rooms.push(normalized);
                }
                room = normalized;
            } else {
                const allActive = (await this.redisService.getAllActiveRooms()) || [];
                const matched = allActive.find(
                    (r) =>
                        Boolean(r?.id && r.id.toLowerCase() === query.toLowerCase()) ||
                        Boolean(r?.shortCode && r.shortCode.toUpperCase() === query.toUpperCase()),
                );
                if (matched) {
                    const normalized = normalizeRestoredRoom(matched);
                    if (!this.rooms.some((r) => r.id === normalized.id)) {
                        this.rooms.push(normalized);
                    }
                    room = normalized;
                }
            }
        }
        return room || null;
    }

    async joinRoom(roomId: string, playerId: number, login: string): Promise<GameRoom | null> {
        let room = await this.getRoom(roomId);
        if (!room) return null;
        
        let player = room.players.find((p) => p.id === playerId);
        if (player) {
            player.isOnline = true;
            const currentLeader = room.players.find((p) => p.id === room.leaderId);
            if (!currentLeader || !currentLeader.isOnline) {
                this.roomHelperService.assignNewLeader(room.id);
            }
            this.roomHelperService.cancelRoomCleanup(room.id);
            await this.redisService.saveRoom(room);
            this.broadcastRoomsList();
            return room;
        }

        const isParty = Boolean(room.lobbyOptions?.isPartyMode);
        const isAllowedState =
            room.state === GameRoomState.ADDING ||
            room.state === GameRoomState.CREATING ||
            (isParty && (
                room.state === GameRoomState.ENDED ||
                room.state === GameRoomState.STARTED
            ));

        if (!isAllowedState) return null;

        if (room.players.length < room.lobbyOptions.maxPlayers) {
            const userInfo = await this.userService.getUserById(playerId).catch(() => null);
            const affectedRooms = this.roomHelperService.removeUserFromOtherRooms(playerId);
            this.notifyRemovedFromOtherRooms(playerId, affectedRooms);
            const isGuest = Boolean(
                (userInfo as any)?.isGuest ||
                (userInfo as any)?.email?.includes('@guest.') ||
                (userInfo as any)?.email?.endsWith('@guest.songuess.local') ||
                (!userInfo && (login?.startsWith('guest_') || login?.includes('_guest_')))
            );
            player = {
                id: playerId,
                login,
                isOnline: true,
                avatar: userInfo?.avatar || null,
                isPremium: userInfo?.isPremium || false,
                customTitle: userInfo?.customTitle || null,
                nameColor: userInfo?.nameColor || null,
                isGuest,
            };
            room.players.push(player);

            const currentLeader = room.players.find((p) => p.id === room.leaderId);
            if (!currentLeader || !currentLeader.isOnline) {
                this.roomHelperService.assignNewLeader(room.id);
            }

            if (room.gameProgress) {
                if (!room.gameProgress.totalScores) room.gameProgress.totalScores = {};
                if (!room.gameProgress.streaks) room.gameProgress.streaks = {};
                if (!room.gameProgress.playerResults) room.gameProgress.playerResults = {};
                room.gameProgress.totalScores[playerId] = 0;
                room.gameProgress.streaks[playerId] = 0;
                room.gameProgress.playerResults[playerId] = {};
            }

            this.roomHelperService.cancelRoomCleanup(room.id);
            await this.redisService.saveRoom(room);
            this.broadcastRoomsList();
            return room;
        }
        return null;
    }

    leaveRoom(playerId: number): void {
        const room = this.roomHelperService.findRoomByPlayerId(playerId);
        if (!room) return;

        room.players = room.players.filter((player) => player.id !== playerId);
        const isClear = this.roomHelperService.cleanUpRoomById(room.id);
        if (!isClear) {
            this.roomHelperService.assignNewLeader(room.id);
            this.roomHelperService.notifyRosterChanged(room);
            this.redisService.saveRoom(room);
        }
        this.broadcastRoomsList();
    }

    kickMember(leaderId: number, roomId: string, memberId: number): boolean {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room || room.leaderId !== leaderId || leaderId === memberId)
            return false;

        const memberExists = room.players.some(
            (player) => player.id === memberId,
        );
        if (!memberExists) return false;

        this.roomHelperService.removePlayerFromRoomById(roomId, memberId);
        this.redisService.saveRoom(room);
        return true;
    }

    startGame(roomId: string, playerId: number): GameRoom | null {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room || room.leaderId !== playerId) return null;
        if (room.state !== GameRoomState.ADDING) return null;

        room.players = room.players.filter((player) => player.isOnline);
        if (room.players.length === 0) return null;

        room.state = GameRoomState.CREATING;
        this.redisService.saveRoom(room);
        this.broadcastRoomsList();
        return room;
    }

    deleteRoomIfLeader(roomId: string, userId: number): boolean {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room) return false;

        const roomIndex = this.rooms.findIndex((r) => r.id === room.id);
        if (roomIndex === -1) return false;

        if (room.leaderId !== userId) return false;

        this.roomHelperService.cancelRoomCleanup(room.id);
        this.roomHelperService.notifyDisposed(room.id);
        this.rooms.splice(roomIndex, 1);
        this.redisService.deleteRoom(room.id);
        this.broadcastRoomsList();
        return true;
    }

    deleteRoomBySystem(roomId: string): boolean {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room) return false;

        const roomIndex = this.rooms.findIndex((r) => r.id === room.id);
        if (roomIndex === -1) return false;

        this.roomHelperService.cancelRoomCleanup(room.id);
        this.roomHelperService.notifyDisposed(room.id);
        this.rooms.splice(roomIndex, 1);
        this.redisService.deleteRoom(room.id);
        this.broadcastRoomsList();
        return true;
    }

    private notifyRemovedFromOtherRooms(
        playerId: number,
        affectedRooms: Array<{
            roomId: string;
            shortCode?: string;
            isDeleted: boolean;
            room?: GameRoom;
        }>,
    ) {
        if (!this.server || affectedRooms.length === 0) return;

        for (const affected of affectedRooms) {
            for (const [, socket] of this.server.sockets.sockets) {
                if (socket.data?.user?.id === playerId) {
                    socket.leave(affected.roomId);
                    if (affected.shortCode) {
                        socket.leave(affected.shortCode);
                    }
                }
            }
            if (!affected.isDeleted && affected.room) {
                const payload = sanitizeRoom(affected.room);
                this.server.to(affected.roomId).emit('playerLeft', payload);
                if (affected.shortCode) {
                    this.server.to(affected.shortCode).emit('playerLeft', payload);
                }
            }
        }
    }

    broadcastRoomsList() {
        this.server?.emit(
            'roomsList',
            this.roomQueryService.getAllJoinableRooms(this.rooms),
        );
    }
}
