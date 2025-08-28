import { Room, RoomState } from '../types/roomTypes';

export function mapBackendRoomToFrontend(room: any): Room {
    return {
        id: room.id,
        state: room.state as RoomState,
        leaderId: room.leaderId,
        lobbyOptions: room.lobbyOptions,
        players: room.players.map((p: any) => ({
            ...p,
            totalScore: room.gameProgress?.totalScores?.[p.id] ?? 0
        }))
    };
}