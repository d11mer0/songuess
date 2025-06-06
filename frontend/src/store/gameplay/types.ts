
import { Room } from '../../types/roomTypes';
import { GameRoundPublicData } from '../../types/gameTypes';

export interface RoundResult {
    correctAnswer: string;
    answer: string;
    timeTaken: number;
    isCorrect: boolean;
}

export interface GameplayState {
    currentRoom: Room | null;
    rooms: Room[];
    trackInfo: GameRoundPublicData | null;
    roundResult: RoundResult | null;
    initialAnswer: string | null;
}
