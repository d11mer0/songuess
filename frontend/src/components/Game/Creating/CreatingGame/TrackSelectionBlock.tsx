
import { FC } from 'react';
import ArtistSelection from '../TracksSelection/ArtistSelection';
import PlaylistSelection from '../TracksSelection/PlaylistSelection';
import AlbumSelection from '../TracksSelection/AlbumSelection';
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
        case 'ARTIST':
            return <ArtistSelection handleStart={onStart} />;
        case 'PLAYLIST':
            return <PlaylistSelection handleStart={onStart} />;
        case 'ALBUM':
            return <AlbumSelection handleStart={onStart} />;
        default:
            return null;
    }
};

export default TrackSelectionBlock;