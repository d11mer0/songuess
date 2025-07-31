import SearchDropdown from '../../SearchDropdown/SearchDropdown';
import { useSearchDeezerQuery } from '../../../store/api/deezerApi';

interface Playlist {
    id: number;
    title: string;
    user?: { name: string };
}

interface PlaylistSearchProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onSelect: (playlistId: number) => void;
}

const PlaylistSearch: React.FC<PlaylistSearchProps> = ({
    searchTerm,
    setSearchTerm,
    onSelect,
}) => {
    const { data: searchResults } = useSearchDeezerQuery(
        { query: searchTerm, type: 'playlist' },
        { skip: searchTerm.length < 2 },
    );

    return (
        <SearchDropdown<Playlist>
            value={searchTerm}
            setValue={setSearchTerm}
            options={(searchResults?.data as Playlist[])?.slice(0, 5) || []}
            onSelect={onSelect}
            optionLabel="title"
            getSubtext={(playlist) => playlist.user?.name || 'Unknown author'}
            placeholder="Search playlist... e.g. 'Dua Lipa - Best Tracks'"
        />
    );
};

export default PlaylistSearch;
