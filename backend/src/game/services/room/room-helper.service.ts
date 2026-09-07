import { Injectable, Optional } from '@nestjs/common';
import { GameRoom } from '../../interfaces/game.interface';
import { GameRoomState } from '../../interfaces/game.interface';
import { RoomManagerService } from './room-manager.service';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class RoomHelperService {
    private disconnectGraceTimers = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly roomManagerService: RoomManagerService,
        @Optional() private readonly redisService?: RedisService,
    ) {}

    assignNewLeader(roomId: string) {
        const room = this.findRoom(roomId);
        if (!room) return;

        const newLeader = room.players.find((player) => player.isOnline);
        if (newLeader) room.leaderId = newLeader.id;
    }

    removeUserFromOtherRooms(playerId: number) {
        for (const room of this.roomManagerService.allRooms) {
            const isInRoom = room.players.some((p) => p.id === playerId);
            if (isInRoom) {
                room.players = room.players.filter((p) => p.id !== playerId);
                const isClear = this.cleanUpRoomById(room.id, true);
                if (!isClear) this.assignNewLeader(room.id);
            }
        }
    }

    removePlayerFromRoomById(roomId: string, playerId: number) {
        const room = this.findRoom(roomId);
        if (!room) return;

        room.players = room.players.filter((player) => player.id !== playerId);
        const isClear = this.cleanUpRoomById(roomId, true);
        if (!isClear) this.assignNewLeader(roomId);
        this.roomManagerService.broadcastRoomsList();
    }

    cancelRoomCleanup(roomId: string) {
        const timer = this.disconnectGraceTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.disconnectGraceTimers.delete(roomId);
        }
    }

    scheduleRoomCleanup(roomId: string, delayMs = 10000) {
        this.cancelRoomCleanup(roomId);
        const timer = setTimeout(() => {
            this.disconnectGraceTimers.delete(roomId);
            this.executeRoomCleanup(roomId);
        }, delayMs);
        this.disconnectGraceTimers.set(roomId, timer);
    }

    executeRoomCleanup(roomId: string) {
        const rooms = this.roomManagerService.allRooms;
        const roomIndex = rooms.findIndex((room) => room.id === roomId);
        if (roomIndex === -1) return;

        const room = rooms[roomIndex];
        const hasOnlinePlayers = room.players.some((player) => player.isOnline);
        if (room.players.length === 0 || !hasOnlinePlayers) {
            rooms.splice(roomIndex, 1);
            this.redisService?.deleteRoom(roomId);
            this.roomManagerService.broadcastRoomsList();
        }
    }

    cleanUpRoomById(roomId: string, immediate = false): boolean | null {
        const rooms = this.roomManagerService.allRooms;
        const roomIndex = rooms.findIndex((room) => room.id === roomId);
        if (roomIndex === -1) return null;

        const room = rooms[roomIndex];

        if (
            room.state !== GameRoomState.ADDING &&
            room.state !== GameRoomState.ENDED
        )
            return false;

        const hasOnlinePlayers = room.players.some((player) => player.isOnline);

        if (room.players.length === 0) {
            this.cancelRoomCleanup(roomId);
            rooms.splice(roomIndex, 1);
            this.redisService?.deleteRoom(roomId);
            this.roomManagerService.broadcastRoomsList();
            return true;
        }

        if (!hasOnlinePlayers) {
            if (immediate) {
                this.cancelRoomCleanup(roomId);
                rooms.splice(roomIndex, 1);
                this.redisService?.deleteRoom(roomId);
                this.roomManagerService.broadcastRoomsList();
                return true;
            } else {
                this.scheduleRoomCleanup(roomId, 10000);
                return false;
            }
        }

        this.cancelRoomCleanup(roomId);
        return false;
    }

    generateShortCode(): string {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        const existingCodes = new Set(this.roomManagerService.allRooms.map((r) => r.shortCode?.toUpperCase()));
        do {
            code = '';
            for (let i = 0; i < 4; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (existingCodes.has(code));
        return code;
    }

    generateRoomId(): string {
        return Math.random().toString(36).substring(2, 9);
    }

    findRoom(roomIdOrCode: string): GameRoom | undefined {
        if (!roomIdOrCode) return undefined;
        const q = roomIdOrCode.trim();
        return this.roomManagerService.allRooms.find(
            (room) => room.id.toLowerCase() === q.toLowerCase() || (room.shortCode && room.shortCode.toUpperCase() === q.toUpperCase()),
        );
    }

    findRoomByPlayerId(playerId: number): GameRoom | undefined {
        return this.roomManagerService.allRooms.find((room) =>
            room.players.some((player) => player.id === playerId),
        );
    }
}
