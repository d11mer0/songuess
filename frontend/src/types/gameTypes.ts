export type GameType = 'ARTIST' | 'PLAYLIST' | 'ALBUM';

export interface GameRoundPublicData {
    options: string[]; // 4 варіанти відповіді (тільки назви треків)
    preview: string; // URL прев'ю треку
    roundNumber: number; // номер раунду
    startedAt: number; // таймстемп старту раунду (у мілісекундах)
}

export interface ArtistInfo {
    id: number;
    name: string;
    picture?: string;
    cover_big?: string;
    picture_big?: string; // Робимо `picture_big` необов'язковим
}

export interface PlaylistInfo {
    id: string;
    title: string;
    picture?: string;
    popularity?: string;
}

export interface AlbumInfo {
    id: string;
    title: string;
    picture?: string;
    cover_big?: string;
}

export interface TrackItem {
    album?: AlbumInfo;
    artist?: ArtistInfo;
    playlist?: PlaylistInfo;
    id: string;
    title: string;
    preview: string;
}

export interface SelectedTracks {
    type?: GameType;
    artist?: ArtistInfo;
    playlist?: PlaylistInfo;
    album?: AlbumInfo;
    tracks: TrackItem[];
}
