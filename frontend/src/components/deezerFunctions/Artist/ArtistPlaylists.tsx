import { useState, useEffect } from 'react';
import {
    useSearchPlaylistsByArtistQuery,
    useGetPlaylistByIdQuery,
} from '../../../store/api/deezerApi';
import PlaylistList from '../Playlist/PlaylistList';
import PlaylistTracks from '../Playlist/PlaylistTracks';
import { SelectedTracks } from '../../../types/gameTypes';

interface ArtistPlaylistsProps {
    artistName: string;
    isList?: boolean;
    onSendTracks?: (tracks: SelectedTracks) => void;
}

export const ArtistPlaylists: React.FC<ArtistPlaylistsProps> = ({
    artistName,
    onSendTracks,
    isList = true,
}) => {
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(
        null,
    );

    // Запит на отримання плейлістів виконавця
    const { data: playlists, isLoading: isLoadingPlaylists } =
        useSearchPlaylistsByArtistQuery(artistName);

    // Запит на отримання деталей плейліста + його треків
    const { data: playlistData, isLoading: isLoadingTracks } =
        useGetPlaylistByIdQuery(selectedPlaylistId, {
            skip: !selectedPlaylistId,
        });

    if (!artistName) return null;

    return (
        <div>
            <h2>Плейлісти {artistName}</h2>
            <PlaylistList
                playlists={playlists || []}
                isLoading={isLoadingPlaylists}
                onSelect={setSelectedPlaylistId}
            />

            {selectedPlaylistId && (
                <PlaylistTracks
                    tracks={playlistData?.tracks?.data || []}
                    isLoading={isLoadingTracks}
                    isList={isList}
                />
            )}
            {onSendTracks && (
                <button
                    onClick={() => {
                        onSendTracks({
                            playlist: {
                                id: playlistData.id,
                                title: playlistData.title,
                                picture: playlistData.picture_big,
                            },
                            tracks: playlistData?.tracks?.data,
                        });
                    }}
                >
                    send data
                </button>
            )}
        </div>
    );
};

export default ArtistPlaylists;
