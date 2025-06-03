import { FC, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import ArtistSelection from './TracksSelection/ArtistSelection';
import PlaylistSelection from './TracksSelection/PlaylistSelection';
import AlbumSelection from './TracksSelection/AlbumSelection';
import { GameType, SelectedTracks } from '../../../types/gameTypes';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentRoom } from '../../../store/gameplay/gameplaySelectors';

interface CreatingGameProps {
    startGame: (tracks: SelectedTracks) => void;
}

const CreatingGame: FC<CreatingGameProps> = ({ startGame }) => {
    const { user } = useSelector((state: RootState) => state.user);
    const currentRoom = useAppSelector(selectCurrentRoom);
    
    const [selectedGameType, setSelectedGameType] =
        useState<GameType>('ARTIST');
    
    if (!currentRoom) return <div>Some troubles with currentRoom</div>;
    
    if (user?.id !== currentRoom.leaderId) {
        return <div>Your leader is setting up the lobby, please wait...</div>;
    }

    return (
        <div>
            <div>
                <h1>Select Game Type:</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setSelectedGameType('ARTIST')}>
                        Artist
                    </button>
                    <button onClick={() => setSelectedGameType('PLAYLIST')}>
                        Playlist
                    </button>
                    <button onClick={() => setSelectedGameType('ALBUM')}>
                        Album
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                {selectedGameType === 'ARTIST' && (
                    <div>
                        <h2>Artist Mode</h2>
                        <ArtistSelection handleStart={startGame} />
                    </div>
                )}

                {selectedGameType === 'PLAYLIST' && (
                    <div>
                        <h2>Playlist Mode</h2>
                        <PlaylistSelection handleStart={startGame} />
                    </div>
                )}

                {selectedGameType === 'ALBUM' && (
                    <div>
                        <h2>Album Mode</h2>
                        <AlbumSelection handleStart={startGame} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatingGame;
