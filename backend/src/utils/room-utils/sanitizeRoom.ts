import { GameRoom } from '../../game/interfaces/game.interface';
import { SafeGameRoom } from '../../game/interfaces/safe-game.interface';

export function sanitizeRoom(room: GameRoom): SafeGameRoom {
    const { gameData, gameProgress, ...safeRoom } = room;

    return {
        ...safeRoom,
        gameProgress: gameProgress
            ? {
                  totalScores: gameProgress.totalScores,
                  currentRound: gameProgress.currentRound,
              }
            : undefined,
    };
}