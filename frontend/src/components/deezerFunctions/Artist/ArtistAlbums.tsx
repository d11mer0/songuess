import styles from './Artist.module.css';
import { useGetAlbumsByArtistQuery } from '../../../store/api/deezerApi';
import Loader from '../../UI/Loader/Loader/Loader';

interface Album {
    id: number;
    title: string;
    cover_big: string;
    release_date: string;
    fans: number;
}

interface ArtistAlbumsProps {
    artistId: number;
    onSelectAlbum: (albumId: number) => void;
    selectedAlbumId: number | null;
}

const ArtistAlbums: React.FC<ArtistAlbumsProps> = ({
    artistId,
    onSelectAlbum,
    selectedAlbumId,
}) => {
    const {
        data: albumsData,
        isLoading,
        error,
    } = useGetAlbumsByArtistQuery(artistId, { skip: !artistId });

    if (isLoading) return <Loader text='Playlists are loading, please wait'/>;
    if (!albumsData?.data?.length) return <></>

    return (
        <div className={styles.albumWrapper}>
            <div className={styles.albumGrid}>
                {albumsData.data.map((album: Album) => {
                    const isActive = selectedAlbumId === album.id;
                    return (
                        <div
                            key={album.id}
                            className={`${styles.albumCard} ${isActive ? styles.active : ''}`}
                            onClick={() => onSelectAlbum(album.id)}
                            title={album.title}
                        >
                            <img
                                src={album.cover_big}
                                alt={album.title}
                                className={styles.albumImage}
                            />
                            <div className={styles.albumInfo}>
                                <p className={styles.albumTitle}>{album.title}</p>
                                <p className={styles.fans}>Fans: {album.fans.toLocaleString()}</p>
                                <p className={styles.releaseDate}>
                                    {new Date(album.release_date).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                                
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ArtistAlbums;
