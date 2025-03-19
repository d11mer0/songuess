import { useState } from "react";
import { useSearchDeezerQuery } from "../../store/api/deezerApi";
import AlbumSearch from "../../components/deezerFunctions/Album/AlbumSearch";

import AlbumOverview from "../../components/deezerFunctions/Album/AlbumOverview";

const AlbumPage: React.FC = () => {
  const [albumName, setAlbumName] = useState("");
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);

  const { data: albumResults, isLoading: isSearching } = useSearchDeezerQuery(
    { query: albumName, type: "album" },
    { skip: albumName.length < 3 }
  );

  return (
    <div className="album-page">
      <h2>Find an Album</h2>

      {/* 🔹 Пошук альбому */}
      <AlbumSearch
        albumName={albumName}
        setAlbumName={setAlbumName}
        albumResults={albumResults?.data || []}
        onSelect={setSelectedAlbumId}
      />

      {/* 🔹 Деталі альбому + треки */}
      {selectedAlbumId && <AlbumOverview albumId={selectedAlbumId} />}
    </div>
  );
};

export default AlbumPage;