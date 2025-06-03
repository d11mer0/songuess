import { useGetAllTracksByArtistQuery } from '../../../store/api/deezerApi';
import { SelectedTracks, TrackItem } from '../../../types/gameTypes';
import TrackList from '../Track/TrackList';

interface ArtistTracksProps {
    artistId: number;
    onSendTracks?: (tracks: SelectedTracks) => void;
    isList?: boolean;
}

const ArtistTracks: React.FC<ArtistTracksProps> = ({
    artistId,
    onSendTracks,
    isList = true,
}) => {
    const { data, error, isLoading } = useGetAllTracksByArtistQuery(artistId);
    const tracks =
        data?.map((track: TrackItem) => ({
            id: track.id,
            title: track.title,
            preview: track.preview,
            album: {
                id: track.album?.id,
                title: track.album?.title,
                picture: track.album?.picture,
            },
        })) || [];

    return (
        <>
            <TrackList
                title="Треки артиста"
                tracks={tracks}
                isLoading={isLoading}
                error={error}
                isList={isList}
            />
            {onSendTracks && (
                <button
                    onClick={() => {
                        onSendTracks({ tracks: tracks });
                    }}
                >
                    send data
                </button>
            )}
        </>
    );
};

export default ArtistTracks;
