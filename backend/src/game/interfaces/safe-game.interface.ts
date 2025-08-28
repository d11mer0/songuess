import { GameRoom } from "./game.interface";


export interface SafeGameProgress {
    currentRound: number;
    totalScores: Record<number, number>;
}

export interface SafeGameRoom extends Omit<GameRoom, 'gameData' | 'gameProgress'> {
    gameProgress?: SafeGameProgress;
}
