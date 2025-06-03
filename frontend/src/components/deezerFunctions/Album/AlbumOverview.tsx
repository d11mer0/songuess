import { useGetAlbumByIdQuery } from '../../../store/api/deezerApi';
import { SelectedTracks } from '../../../types/gameTypes';
import TrackList from '../Track/TrackList';

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
        error,
    } = useGetAlbumByIdQuery(albumId, { skip: !albumId });

    if (isLoading) return <p>Завантаження...</p>;
    if (error)
        return <p style={{ color: 'red' }}>Помилка завантаження альбому</p>;
    if (!albumData) return null;

    const tracks =
        albumData.tracks?.data.map((track: Track) => ({
            id: track.id,
            title: track.title,
            preview: track.preview,
        })) || [];

    return (
        <div>
            {!hideAlbumInfo && (
                <>
                    <h3>{albumData.title}</h3>
                    <img
                        src={albumData.cover_big}
                        alt={albumData.title}
                        width="200"
                    />
                    <p>Виконавець: {albumData.artist.name}</p>
                </>
            )}

            <TrackList
                title="Треки альбому"
                tracks={tracks}
                isLoading={isLoading}
                isList={isList}
            />
            {onSendTracks && (
                <button
                    onClick={() => {
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
                    }}
                >
                    send data
                </button>
            )}
        </div>
    );
};

export default AlbumOverview;
