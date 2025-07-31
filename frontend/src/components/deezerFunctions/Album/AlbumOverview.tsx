import { useGetAlbumByIdQuery } from '../../../store/api/deezerApi';
import { SelectedTracks } from '../../../types/gameTypes';
import StartGameButtonBlock from '../../Game/Creating/TracksSelection/components/StartGameButtonBlock';
import Loader from '../../UI/Loader/Loader/Loader';
import OverviewLoadingPlaceholder from '../../UI/Loader/OverviewLoading/OverviewLoadingPlaceholder';
import TrackList from '../Track/TrackList';

import styles from './AlbumOverview.module.css';



interface AlbumOverviewProps {
    albumId: number;
    hideAlbumInfo?: boolean;
    isList?: boolean;
    onSendTracks?: (tracks: SelectedTracks) => void;
}

interface Track {
    id: number;
    title: string;
    preview: string;
}

const AlbumOverview: React.FC<AlbumOverviewProps> = ({
    albumId,
    onSendTracks = undefined,
    hideAlbumInfo = false,
    isList = true,
}) => {
    const {
        data: albumData,
        isLoading,
        isFetching,
        error
    } = useGetAlbumByIdQuery(albumId, { skip: !albumId });

    if (isLoading || isFetching) return <Loader text='Tracks are loading...'/>
    if (!albumData || error) return null;

    const handleSendTracks = () => {
        if (!albumData || !onSendTracks) return;
        const {
            tracks: tracksWithData,
            artist,
            ...filteredAlbum
        } = albumData;
        const tracks = tracksWithData?.data || [];

        onSendTracks({
            type: 'ALBUM',
            album: filteredAlbum,
            artist,
            tracks,
        });
    };

    const tracks =
        albumData.tracks?.data.map((track: Track) => ({
            id: track.id,
            title: track.title,
            preview: track.preview,
        })) || [];
        
    return (
        <div className={styles.albumContainer}>
            {!hideAlbumInfo && (
                <div className={styles.albumInfo}>
                    <img
                        src={albumData.cover_big}
                        alt={albumData.title}
                        className={styles.albumCover}
                    />
                    <div className={styles.albumDetails}>
                        <h3 className={styles.albumTitle}>{albumData.title}</h3>
                        <p className={styles.artistName}>
                            <span>Singer:</span> {albumData.artist.name}
                        </p>
                    </div>
                </div>
            )}

            <TrackList
                title="Tracks of selected album"
                tracks={tracks}
                isLoading={isLoading}
                isList={isList}
            />
        
            {onSendTracks && (
                <StartGameButtonBlock
                    trackCount={tracks.length}
                    onClick={handleSendTracks}
                />
            )}
        </div>
    );
};

export default AlbumOverview;
