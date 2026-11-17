export interface RoundTrackWithoutPreview {
    id: string;
    title: string;
    artistName?: string;
    artistId?: number;
    artistPicture?: string;
    albumName?: string;
    albumId?: string | number;
    albumCover?: string;
}

export interface GameEndedPayload {
    roomId?: string;
    myResults: {
        roundNumber: number;
        isCorrect: boolean;
        track: RoundTrackWithoutPreview;
    }[];
}