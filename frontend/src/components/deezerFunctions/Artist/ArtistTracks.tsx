import { useGetAllTracksByArtistQuery } from "../../../store/api/deezerApi";
import TrackList from "../Track/TrackList";

interface ArtistTracksProps {
  artistId: number;
}

interface Track {
  id: number;
  title: string;
  preview: string;
  album?: { title: string };
}

const ArtistTracks: React.FC<ArtistTracksProps> = ({ artistId }) => {
  const { data, error, isLoading } = useGetAllTracksByArtistQuery(artistId);

  const tracks = data?.map((track: Track) => ({
    id: track.id,
    title: track.title,
    preview: track.preview,
    albumName: track.album?.title,
  })) || [];

  return <TrackList title="Треки артиста" tracks={tracks} isLoading={isLoading} error={error} />;
};

export default ArtistTracks;