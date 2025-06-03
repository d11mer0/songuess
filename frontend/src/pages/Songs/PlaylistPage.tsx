import React, { useState } from 'react';
import { useGetPlaylistByIdQuery } from '../../store/api/deezerApi';
import PlaylistSearch from '../../components/deezerFunctions/Playlist/PlaylistSearch';
import PlaylistTracks from '../../components/deezerFunctions/Playlist/PlaylistTracks';
import PlaylistDetails from '../../components/deezerFunctions/Playlist/PlaylistDetails';

const PlaylistPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(
        null,
    );

    const { data: playlistDetails, isLoading: isLoadingTracks } =
        useGetPlaylistByIdQuery(selectedPlaylistId!, {
            skip: !selectedPlaylistId,
        });

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
                    />
                </div>
            )}
        </div>
    );
};

export default PlaylistPage;
