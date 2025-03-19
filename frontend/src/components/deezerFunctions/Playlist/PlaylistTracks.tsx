import TrackList from "../Track/TrackList";

interface Track {
  id: number;
  title: string;
  preview: string;
  artist: { name: string };
}

interface PlaylistTracksProps {
  tracks: Track[];
  isLoading: boolean;
}

const PlaylistTracks: React.FC<PlaylistTracksProps> = ({ tracks, isLoading }) => {
  const formattedTracks = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    preview: track.preview,
    artistName: track.artist.name,
  }));

  return <TrackList title="Треки у вибраному плейлісті" tracks={formattedTracks} isLoading={isLoading} />;
};

export default PlaylistTracks;