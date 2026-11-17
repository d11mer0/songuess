import { FC } from 'react';
import ArtistSelection from '../TracksSelection/ArtistSelection';
import PlaylistSelection from '../TracksSelection/PlaylistSelection';
import AlbumSelection from '../TracksSelection/AlbumSelection';
import ThemesSelection from '../TracksSelection/ThemesSelection';
import UrlPlaylistImport from '../TracksSelection/UrlPlaylistImport';
import { TrackSelectionModeContext } from '../TracksSelection/TrackSelectionModeContext';
import { GameType, SelectedTracks } from '../../../../types/gameTypes';

interface TrackSelectionBlockProps {
    selectedGameType: GameType;
    onStart: (tracks: SelectedTracks) => void;
    autoFocus?: boolean;
    isMixMode?: boolean;
}

const TrackSelectionBlock: FC<TrackSelectionBlockProps> = ({
    selectedGameType,
    onStart,
    autoFocus = false,
    isMixMode = false,
}) => {
    const renderSelector = () => {
        switch (selectedGameType) {
            case 'THEME':
                return <ThemesSelection handleStart={onStart} />;
            case 'ARTIST':
                return <ArtistSelection handleStart={onStart} autoFocus={autoFocus} />;
            case 'PLAYLIST':
                return <PlaylistSelection handleStart={onStart} autoFocus={autoFocus} />;
            case 'ALBUM':
                return <AlbumSelection handleStart={onStart} autoFocus={autoFocus} />;
            case 'URL':
                return <UrlPlaylistImport handleStart={onStart} autoFocus={autoFocus} />;
            default:
                return null;
        }
    };

    return (
        <TrackSelectionModeContext.Provider value={{ isMixMode }}>
            {renderSelector()}
        </TrackSelectionModeContext.Provider>
    );
};

export default TrackSelectionBlock;
