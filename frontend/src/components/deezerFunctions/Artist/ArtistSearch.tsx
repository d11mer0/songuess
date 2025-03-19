import SearchDropdown from "../../SearchDropdown/SearchDropdown";
import { useSearchDeezerQuery } from "../../../store/api/deezerApi";
import { Artist } from "../../deezerFunctions/types";

interface ArtistSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelect: (artist: Artist) => void; // ✅ Передаємо весь об'єкт Artist
}

const ArtistSearch: React.FC<ArtistSearchProps> = ({ searchQuery, setSearchQuery, onSelect }) => {
  const { data: searchData, isLoading, error } = useSearchDeezerQuery(
    { query: searchQuery, type: "artist" },
    { skip: !searchQuery }
  );

  return (
    <div>
      <h2>Пошук виконавця</h2>
      <SearchDropdown<Artist>
        value={searchQuery}
        setValue={setSearchQuery}
        options={searchData?.data || []}
        onSelect={(id: number) => {
          const selectedArtist = (searchData?.data || []).find((artist: Artist) => artist.id === id);
          if (selectedArtist) onSelect(selectedArtist);
        }}
        optionLabel="name"
      />
      {error && <p style={{ color: "red" }}>Помилка завантаження</p>}
    </div>
  );
};

export default ArtistSearch;