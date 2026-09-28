import SearchDropdown from '../../SearchDropdown/SearchDropdown';
import { useSearchDeezerQuery } from '../../../store/api/deezerApi';
import { ArtistInfo } from '../../../types/gameTypes';

import { useDebounce } from '../../../hooks/useDebounce';

interface ArtistSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onSelect: (artist: ArtistInfo) => void; // ✅ Передаємо весь об'єкт Artist
    autoFocus?: boolean;
}

const ArtistSearch: React.FC<ArtistSearchProps> = ({
    searchQuery,
    setSearchQuery,
    onSelect,
    autoFocus = false,
}) => {
    const debouncedQuery = useDebounce(searchQuery, 300);

    const {
        data: searchData,
    } = useSearchDeezerQuery(
        { query: debouncedQuery, type: 'artist' },
        { skip: !debouncedQuery },
    );

    return (
        <SearchDropdown<ArtistInfo>
            value={searchQuery}
            setValue={setSearchQuery}
            options={searchData?.data || []}
            onSelect={(id: number) => {
                const selectedArtist = (searchData?.data || []).find(
                    (artist: ArtistInfo) => artist.id === id,
                );
                if (selectedArtist) onSelect(selectedArtist);
            }}
            optionLabel="name"
            placeholder="Search artist... e.g. 'Dua Lipa'"
            autoFocus={autoFocus}
        />

    );
};

export default ArtistSearch;
