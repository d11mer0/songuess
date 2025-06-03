import { FC, useState } from 'react';
import { useGetPlaylistByIdQuery } from '../../../../store/api/deezerApi';
import PlaylistSearch from '../../../deezerFunctions/Playlist/PlaylistSearch';
import PlaylistTracks from '../../../deezerFunctions/Playlist/PlaylistTracks';
import PlaylistDetails from '../../../deezerFunctions/Playlist/PlaylistDetails';
import { SelectedTracks } from '../../../../types/gameTypes';

interface Props {
    handleStart: (payload: SelectedTracks) => void;
}

const PlaylistSelection: FC<Props> = ({ handleStart }: Props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(
        null,
    );

    const { data: playlistDetails, isLoading: isLoadingTracks } =
        useGetPlaylistByIdQuery(selectedPlaylistId!, {
            skip: !selectedPlaylistId,
        });

    const handleSendTracks = () => {
        handleStart({
            type: 'PLAYLIST',
            playlist: {
                id: playlistDetails.id,
                title: playlistDetails.title,
                picture: playlistDetails.picture_big,
            },
            tracks: playlistDetails?.tracks?.data,
        });
    };

    return (
        <div>
            <h2>Пошук плейлістів</h2>

            <PlaylistSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSelect={setSelectedPlaylistId}
            />

            {playlistDetails && (
                <div>
                    <PlaylistDetails details={playlistDetails} />
                    <PlaylistTracks
                        tracks={playlistDetails.tracks.data}
                        isLoading={isLoadingTracks}
                        isList={false}
                    />
                    <button onClick={handleSendTracks}>send data</button>
                </div>
            )}
        </div>
    );
};

export default PlaylistSelection;
