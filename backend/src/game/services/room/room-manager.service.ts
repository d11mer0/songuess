import { Injectable, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
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
                this.rooms = restored;
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

    async joinRoom(roomId: string, playerId: number, login: string): Promise<GameRoom | null> {
        const room = this.roomHelperService.findRoom(roomId);
        if (!room || room.state !== GameRoomState.ADDING ) return null;
        
        const userInfo = await this.userService.getUserById(playerId);
        let player = room.players.find((p) => p.id === playerId);
        if (!player) {
            
            if (room.players.length < room.lobbyOptions.maxPlayers ) {
                this.roomHelperService.removeUserFromOtherRooms(playerId);
                player = {
                    id: playerId,
                    login,
                    isOnline: true,
                    avatar: userInfo.avatar,
                    isPremium: userInfo.isPremium || false,
                    customTitle: userInfo.customTitle || null,
                    nameColor: userInfo.nameColor || null,
                };
                room.players.push(player);
                await this.redisService.saveRoom(room);
                this.broadcastRoomsList();
                return room;
            }
            return null;
        }
        await this.redisService.saveRoom(room);
        return room;
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
        const roomIndex = this.rooms.findIndex((room) => room.id === roomId);
        if (roomIndex === -1) return false;

        const room = this.rooms[roomIndex];
        if (room.leaderId !== userId) return false;

        this.rooms.splice(roomIndex, 1);
        this.redisService.deleteRoom(roomId);
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
