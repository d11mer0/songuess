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
                console.log('[RoomManagerService] Відновлено ' + restored.length + ' активних кімнат із Redis');
            }
        } catch (err) {
            console.warn('[RoomManagerService] Помилка відновлення кімнат із Redis:', err);
        }
    }

    setServer(server: Server) {
        this.server = server;
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
        this.roomHelperService.removeUserFromOtherRooms(playerId);
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
                roundDuration: Math.min(25, Math.max(5, lobbyOptions?.roundDuration || 25)),
                allowAutoJoin: lobbyOptions.publicLobby
                    ? lobbyOptions.allowAutoJoin
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
            // Check Redis fallback in case room was persisted or shortCode lookup
            const fromRedis = await this.redisService.getRoom(query);
            if (fromRedis) {
                if (!this.rooms.some((r) => r.id === fromRedis.id)) {
                    this.rooms.push(fromRedis);
                }
                room = fromRedis;
            } else {
                const allActive = (await this.redisService.getAllActiveRooms()) || [];
                const matched = allActive.find(
                    (r) =>
                        Boolean(r?.id && r.id.toLowerCase() === query.toLowerCase()) ||
                        Boolean(r?.shortCode && r.shortCode.toUpperCase() === query.toUpperCase()),
                );
                if (matched) {
                    if (!this.rooms.some((r) => r.id === matched.id)) {
                        this.rooms.push(matched);
                    }
                    room = matched;
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
            this.roomHelperService.cancelRoomCleanup(room.id);
            await this.redisService.saveRoom(room);
            this.broadcastRoomsList();
            return room;
        }

        const isParty = Boolean(room.lobbyOptions?.isPartyMode);
        const isAllowedState =
            room.state === GameRoomState.ADDING ||
            (isParty && (
                room.state === GameRoomState.CREATING ||
                room.state === GameRoomState.ENDED ||
                room.state === GameRoomState.STARTED
            ));

        if (!isAllowedState) return null;

        if (room.players.length < room.lobbyOptions.maxPlayers) {
            const userInfo = await this.userService.getUserById(playerId).catch(() => null);
            this.roomHelperService.removeUserFromOtherRooms(playerId);
            const isGuest = Boolean(
                userInfo?.email?.includes('@guest.') ||
                userInfo?.email?.endsWith('@guest.songuess.local') ||
                (!userInfo?.email && (login?.startsWith('guest_') || login?.includes('_guest_')))
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
        this.rooms.splice(roomIndex, 1);
        this.redisService.deleteRoom(room.id);
        this.broadcastRoomsList();
        return true;
    }

    broadcastRoomsList() {
        this.server?.emit(
            'roomsList',
            this.roomQueryService.getAllJoinableRooms(this.rooms),
        );
    }
}
