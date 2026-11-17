import { Injectable } from '@nestjs/common';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';

@Injectable()
export class RoomQueryService {
    getRoomInfo(roomId: string, rooms: GameRoom[]): GameRoom {
        return (
            rooms.find((room) => room.id === roomId) || {
                id: roomId,
                players: [],
                lobbyOptions: {
                    publicLobby: false,
                    allowAutoJoin: false,
                    maxPlayers: 9,
                },
                leaderId: -1,
                state: GameRoomState.ADDING,
            }
        );
    }

    getAllJoinableRooms(rooms: GameRoom[]): GameRoom[] {
        return rooms
            .filter(
                (room) =>
                    room.lobbyOptions.publicLobby &&
                    room.state === GameRoomState.ADDING &&
                    room.players.some((p) => p.isOnline),
            )
            .map((room) => ({
                id: room.id,
                players: room.players,
                lobbyOptions: room.lobbyOptions,
                state: room.state,
                leaderId: room.leaderId,
            }));
    }

    findAvailableRoom(rooms: GameRoom[]): GameRoom | undefined {
        return rooms.find(
            (room) =>
                room.lobbyOptions.allowAutoJoin &&
                room.players.filter((p) => p.isOnline).length < room.lobbyOptions.maxPlayers &&
                room.state === GameRoomState.ADDING,
        );
    }
}
