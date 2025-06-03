export interface GameProgress {
    currentRound: number;
    rounds: GameRound[]; // масив усіх раундів
    playerResults: Record<number, Record<number, PlayerRoundResult>>;
}

export interface GameRound {
    roundNumber: number;
    track: RoundTrack;
    options: string[];
    startedAt: number;
}

export interface RoundTrack {
    id: string;
    title: string;
    preview: string;
    artistName?: string;
    albumName?: string;
}

export interface PlayerRoundResult {
    answer: string | null;
    isCorrect: boolean;
    timeTaken: number | null;
}
