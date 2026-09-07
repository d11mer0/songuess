import { Room } from '../../types/roomTypes';
import { GameRoundPublicData } from '../../types/gameTypes';
import { GameEndedPayload } from '../../types/gameEndedTypes';

export interface PlayerRoundScore {
    playerId: number;
    answer: string;
    timeTaken: number;
    score: number;
    totalScore: number;
    isCorrect: boolean;
    streak?: number;
}

export interface RoundResult {
    correctAnswer: string;
    results: PlayerRoundScore[];
    myResult: PlayerRoundScore;
    streaks?: Record<number, number>;
}

export interface GameplayState {
    currentRoom: Room | null;
    rooms: Room[];
    trackInfo: GameRoundPublicData | null;
    roundResult: RoundResult | null;
    initialAnswer: string | null;
    gameEndedData: GameEndedPayload | null;
}