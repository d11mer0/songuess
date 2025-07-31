import TrackList from '../Track/TrackList';

interface Track {
    id: number;
    title: string;
    preview: string;
    artist: { name: string };
}

interface PlaylistTracksProps {
    tracks: Track[];
    isLoading: boolean;
    isList?: boolean;
}

const PlaylistTracks: React.FC<PlaylistTracksProps> = ({
    tracks,
    isLoading,
    isList = true,
}) => {
    const formattedTracks = tracks.map((track) => ({
        id: track.id,
        title: track.title,
        preview: track.preview,
        artistName: track.artist.name,
    }));

    return (
        <TrackList
            title="Tracks in selected playlist"
            tracks={formattedTracks}
            isLoading={isLoading}
            isList={isList}
        />
    );
};

export default PlaylistTracks;
