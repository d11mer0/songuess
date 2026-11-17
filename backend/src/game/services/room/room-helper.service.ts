import { Injectable, Optional } from '@nestjs/common';
import { GameRoom } from '../../interfaces/game.interface';
import { GameRoomState } from '../../interfaces/game.interface';
import { RoomManagerService } from './room-manager.service';
import { RedisService } from '../../../redis/redis.service';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';

@Injectable()
export class RoomHelperService {
    private disconnectGraceTimers = new Map<string, NodeJS.Timeout>();
    private leaderReassignTimers = new Map<string, NodeJS.Timeout>();
    private disposeCallbacks: Array<(roomId: string) => void> = [];
    private rosterChangedCallbacks: Array<(room: GameRoom) => void> = [];

    onRoomDisposed(cb: (roomId: string) => void) {
        this.disposeCallbacks.push(cb);
    }

    notifyDisposed(roomId: string) {
        for (const cb of this.disposeCallbacks) {
            try { cb(roomId); } catch {}
        }
    }

    onRosterChanged(cb: (room: GameRoom) => void) {
        this.rosterChangedCallbacks.push(cb);
    }

    notifyRosterChanged(room: GameRoom) {
        for (const cb of this.rosterChangedCallbacks) {
            try { cb(room); } catch {}
        }
    }

    constructor(
        private readonly roomManagerService: RoomManagerService,
        @Optional() private readonly redisService?: RedisService,
    ) {}

    cancelLeaderReassignment(roomId: string) {
        const timer = this.leaderReassignTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.leaderReassignTimers.delete(roomId);
        }
    }

    scheduleLeaderReassignment(roomId: string, delayMs = 7000) {
        this.cancelLeaderReassignment(roomId);
        const timer = setTimeout(() => {
            this.leaderReassignTimers.delete(roomId);
            const room = this.findRoom(roomId);
            if (!room) return;
            const currentLeader = room.players.find((p) => p.id === room.leaderId);
            if (!currentLeader || !currentLeader.isOnline) {
                this.assignNewLeader(roomId);
                this.roomManagerService.syncRoom(room);
                this.roomManagerService.broadcastRoomsList();
                const safeRoom = sanitizeRoom(room);
                this.roomManagerService.serverInfo?.to(roomId).emit(
                    'playerDisconnected',
                    safeRoom,
                );
                if (room.shortCode) {
                    this.roomManagerService.serverInfo?.to(room.shortCode).emit(
                        'playerDisconnected',
                        safeRoom,
                    );
                }
            }
        }, delayMs);
        this.leaderReassignTimers.set(roomId, timer);
    }

    assignNewLeader(roomId: string) {
        const room = this.findRoom(roomId);
        if (!room) return;

        const currentLeader = room.players.find((p) => p.id === room.leaderId);
        if (currentLeader && currentLeader.isOnline) return;

        const newLeader = room.players.find((player) => player.isOnline);
        if (newLeader) room.leaderId = newLeader.id;
    }

    removeUserFromOtherRooms(playerId: number): Array<{
        roomId: string;
        shortCode?: string;
        isDeleted: boolean;
        room?: GameRoom;
    }> {
        const affectedRooms: Array<{
            roomId: string;
            shortCode?: string;
            isDeleted: boolean;
            room?: GameRoom;
        }> = [];

        for (const room of [...this.roomManagerService.allRooms]) {
            const isInRoom = room.players.some((p) => p.id === playerId);
            if (isInRoom) {
                room.players = room.players.filter((p) => p.id !== playerId);
                const isClear = Boolean(this.cleanUpRoomById(room.id, true));
                if (!isClear) {
                    this.assignNewLeader(room.id);
                    this.roomManagerService.syncRoom(room);
                    this.notifyRosterChanged(room);
                }
                affectedRooms.push({
                    roomId: room.id,
                    shortCode: room.shortCode,
                    isDeleted: isClear,
                    room: isClear ? undefined : room,
                });
            }
        }

        if (affectedRooms.length > 0) {
            this.roomManagerService.broadcastRoomsList();
        }
        return affectedRooms;
    }

    removePlayerFromRoomById(roomId: string, playerId: number) {
        const room = this.findRoom(roomId);
        if (!room) return;

        room.players = room.players.filter((player) => player.id !== playerId);
        const isClear = this.cleanUpRoomById(roomId, true);
        if (!isClear) {
            this.assignNewLeader(roomId);
            this.notifyRosterChanged(room);
        }
        this.roomManagerService.broadcastRoomsList();
    }

    cancelRoomCleanup(roomId: string) {
        const timer = this.disconnectGraceTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.disconnectGraceTimers.delete(roomId);
        }
        this.cancelLeaderReassignment(roomId);
    }

    hasActiveCleanupTimer(roomId: string): boolean {
        return this.disconnectGraceTimers.has(roomId);
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
            this.notifyDisposed(roomId);
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
        const hasOnlinePlayers = room.players.some((player) => player.isOnline);

        if (hasOnlinePlayers && room.players.length > 0) {
            this.cancelRoomCleanup(roomId);
            return false;
        }

        if (room.players.length === 0) {
            this.cancelRoomCleanup(roomId);
            this.notifyDisposed(roomId);
            rooms.splice(roomIndex, 1);
            this.redisService?.deleteRoom(roomId);
            this.roomManagerService.broadcastRoomsList();
            return true;
        }

        if (!hasOnlinePlayers) {
            if (immediate) {
                this.cancelRoomCleanup(roomId);
                this.notifyDisposed(roomId);
                rooms.splice(roomIndex, 1);
                this.redisService?.deleteRoom(roomId);
                this.roomManagerService.broadcastRoomsList();
                return true;
            } else {
                const graceDelay = room.state === GameRoomState.STARTED ? 15000 : 10000;
                this.scheduleRoomCleanup(roomId, graceDelay);
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
