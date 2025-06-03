// selected-tracks.interface.ts (на бекенді)
export type GameType = 'ARTIST' | 'PLAYLIST' | 'ALBUM';

export interface ArtistInfo {
    id: number;
    name: string;
    picture?: string;
    cover_big?: string;
    picture_big?: string;
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
