import { Injectable } from '@nestjs/common';
import { GameRoom } from '../../interfaces/game.interface';
import { GameRoomState } from '../../interfaces/game.interface';
import { RoomManagerService } from './room-manager.service';

@Injectable()
export class RoomHelperService {
    constructor(private readonly roomManagerService: RoomManagerService) {}

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
                const isClear = this.cleanUpRoomById(room.id);
                if (!isClear) this.assignNewLeader(room.id);
            }
        }
    }

    removePlayerFromRoomById(roomId: string, playerId: number) {
        const room = this.findRoom(roomId);
        if (!room) return;

        room.players = room.players.filter((player) => player.id !== playerId);
        const isClear = this.cleanUpRoomById(roomId);
        if (!isClear) this.assignNewLeader(roomId);
        this.roomManagerService.broadcastRoomsList();
    }

    cleanUpRoomById(roomId: string): boolean | null {
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
        if (room.players.length === 0 || !hasOnlinePlayers) {
            rooms.splice(roomIndex, 1);
            this.roomManagerService.broadcastRoomsList();
            return true;
        }

        return false;
    }

    generateRoomId(): string {
        return Math.random().toString(36).substring(2, 9);
    }

    findRoom(roomId: string): GameRoom | undefined {
        return this.roomManagerService.allRooms.find(
            (room) => room.id === roomId,
        );
    }

    findRoomByPlayerId(playerId: number): GameRoom | undefined {
        return this.roomManagerService.allRooms.find((room) =>
            room.players.some((player) => player.id === playerId),
        );
    }
}
