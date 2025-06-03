import { useGetAlbumsByArtistQuery } from '../../../store/api/deezerApi';

interface Album {
    id: number;
    title: string;
    cover_big: string;
}

interface ArtistAlbumsProps {
    artistId: number;
    onSelectAlbum: (albumId: number) => void;
}

const ArtistAlbums: React.FC<ArtistAlbumsProps> = ({
    artistId,
    onSelectAlbum,
}) => {
    const {
        data: albumsData,
        isLoading,
        error,
    } = useGetAlbumsByArtistQuery(artistId, { skip: !artistId });

    return (
        <div>
            <h3>Альбоми</h3>

            {isLoading ? (
                <p>Завантаження...</p>
            ) : error ? (
                <p style={{ color: 'red' }}>Помилка завантаження альбомів</p>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {albumsData?.data?.map((album: Album) => (
                        <div
                            key={album.id}
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                            onClick={() => onSelectAlbum(album.id)}
                        >
                            <img
                                src={album.cover_big}
                                alt={album.title}
                                style={{ width: '150px', borderRadius: '8px' }}
                            />
                            <p>{album.title}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArtistAlbums;
