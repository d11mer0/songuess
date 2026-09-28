export interface GameProgress {
    currentRound: number;
    rounds: GameRound[]; // масив усіх раундів
    playerResults: Record<number, Record<number, PlayerRoundResult>>;
    totalScores: Record<number, number>;
    streaks?: Record<number, number>; // поточні серії правильних відповідей
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
    artistId?: number;
    artistName?: string;
    artistPicture?: string;
    albumId?: string | number;
    albumName?: string;
    albumCover?: string;
}

export interface PlayerRoundResult {
    answer: string | null;
    isCorrect: boolean;
    timeTaken: number | null;
    score: number;
    snippetDurationUsed?: number;
    matchSimilarity?: number;
    streak?: number;
}
