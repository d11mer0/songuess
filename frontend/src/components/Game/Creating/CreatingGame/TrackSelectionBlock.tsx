
import { FC } from 'react';
import ArtistSelection from '../TracksSelection/ArtistSelection';
import PlaylistSelection from '../TracksSelection/PlaylistSelection';
import AlbumSelection from '../TracksSelection/AlbumSelection';
import ThemesSelection from '../TracksSelection/ThemesSelection';
import UrlPlaylistImport from '../TracksSelection/UrlPlaylistImport';
import { GameType, SelectedTracks } from '../../../../types/gameTypes';

interface TrackSelectionBlockProps {
    selectedGameType: GameType;
    onStart: (tracks: SelectedTracks) => void;
}

const TrackSelectionBlock: FC<TrackSelectionBlockProps> = ({
    selectedGameType,
    onStart,
}) => {
    switch (selectedGameType) {
        case 'THEME':
            return <ThemesSelection handleStart={onStart} />;
        case 'ARTIST':
            return <ArtistSelection handleStart={onStart} />;
        case 'PLAYLIST':
            return <PlaylistSelection handleStart={onStart} />;
        case 'ALBUM':
            return <AlbumSelection handleStart={onStart} />;
        case 'URL':
            return <UrlPlaylistImport handleStart={onStart} />;
        default:
            return null;
    }
};

export default TrackSelectionBlock;