export interface RoundTrackWithoutPreview {
    id: string;
    title: string;
    artistName?: string;
    albumName?: string;
}

export interface GameEndedPayload {
    myResults: {
        roundNumber: number;
        isCorrect: boolean;
        track: RoundTrackWithoutPreview;
    }[];
}