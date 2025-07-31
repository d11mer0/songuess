import { useState, useEffect } from 'react';
import {
    useSearchPlaylistsByArtistQuery,
    useGetPlaylistByIdQuery,
} from '../../../store/api/deezerApi';
import PlaylistList from '../Playlist/PlaylistList';
import PlaylistTracks from '../Playlist/PlaylistTracks';
import { SelectedTracks } from '../../../types/gameTypes';
import StartGameButtonBlock from '../../Game/Creating/TracksSelection/components/StartGameButtonBlock';
import Loader from '../../UI/Loader/Loader/Loader';

import styles from './Artist.module.css';

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

    const { data: playlists, isFetching: isLoadingPlaylists } =
        useSearchPlaylistsByArtistQuery(artistName);

    const { data: playlistData, isFetching: isLoadingTracks } =
        useGetPlaylistByIdQuery(selectedPlaylistId, {
            skip: !selectedPlaylistId,
        });

    useEffect(() => {
        setSelectedPlaylistId(null);
    }, [artistName]);

    if (!artistName) return null;

    return (
        <div>
            <div className={styles.header}>
                <h2 className={styles.playlistsTitle}>Top 5 playlists of <span className={styles.artist}>{artistName}</span></h2>
            </div>
            
             <div className={styles.list}>
                {isLoadingPlaylists ? (
                    <Loader text="Searching playlists..." />
                ) : (
                    <PlaylistList
                        playlists={playlists || []}
                        onSelect={setSelectedPlaylistId}
                        selectedId={selectedPlaylistId || undefined}
                    />
                )}
            </div>

            {(selectedPlaylistId && !isLoadingPlaylists) && (
                <div className={styles.details}>
                    {isLoadingTracks ? (
                        <Loader text="Loading selected playlist..." />
                    ) : (
                        <PlaylistTracks
                            tracks={playlistData?.tracks?.data || []}
                            isLoading={isLoadingTracks}
                            isList={isList}
                        />
                    )}
                </div>
            )}
            
            {(onSendTracks && selectedPlaylistId && !isLoadingPlaylists && !isLoadingTracks) && (
                <>
                    <StartGameButtonBlock
                        trackCount={playlistData?.tracks?.data.length}
                        onClick={() => {
                            onSendTracks({
                                playlist: {
                                    id: playlistData.id,
                                    title: playlistData.title,
                                    picture: playlistData.picture_big,
                                },
                                tracks: playlistData?.tracks?.data,
                            })
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default ArtistPlaylists;
