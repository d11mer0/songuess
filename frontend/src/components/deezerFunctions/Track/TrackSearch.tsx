import SearchDropdown from '../../SearchDropdown/SearchDropdown';

interface Artist {
    id: number;
    name: string;
}

interface Track {
    id: number;
    title: string;
    artist: Artist;
}

interface TrackSearchProps {
    trackName: string;
    setTrackName: (name: string) => void;
    trackResults: Track[];
    onSelect: (trackId: number) => void;
}

const TrackSearch: React.FC<TrackSearchProps> = ({
    trackName,
    setTrackName,
    trackResults,
    onSelect,
}) => {
    return (
        <SearchDropdown<Track>
            value={trackName}
            setValue={setTrackName}
            options={trackResults}
            onSelect={onSelect}
            optionLabel="title"
            getSubtext={(track) => track.artist.name}
        />
    );
};

export default TrackSearch;
