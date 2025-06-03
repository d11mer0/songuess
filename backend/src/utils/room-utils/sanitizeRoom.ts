import { GameRoom } from '../../game/interfaces/game.interface';

export function sanitizeRoom(room: GameRoom): GameRoom {
    const { gameProgress, gameData, ...safeRoom } = room;
    return safeRoom;
}
