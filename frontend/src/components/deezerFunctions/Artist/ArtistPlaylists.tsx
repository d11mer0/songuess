import { useState, useEffect } from "react";
import { useSearchPlaylistsByArtistQuery, useGetPlaylistByIdQuery } from "../../../store/api/deezerApi";
import PlaylistList from "../Playlist/PlaylistList";
import PlaylistTracks from "../Playlist/PlaylistTracks";

interface ArtistPlaylistsProps {
  artistName: string;
  onLoad?: () => void; // ✅ Додали onLoad як опціональний проп
}

export const ArtistPlaylists: React.FC<ArtistPlaylistsProps> = ({ artistName, onLoad }) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);

  // Запит на отримання плейлістів виконавця
  const { data: playlists, isLoading: isLoadingPlaylists } = useSearchPlaylistsByArtistQuery(artistName);

  // Запит на отримання деталей плейліста + його треків
  const { data: playlistData, isLoading: isLoadingTracks } = useGetPlaylistByIdQuery(selectedPlaylistId, {
    skip: !selectedPlaylistId,
  });

  // ✅ Викликаємо `onLoad`, коли дані завантажені
  useEffect(() => {
    if (!isLoadingPlaylists && playlists) {
      onLoad?.();
    }
  }, [isLoadingPlaylists, playlists, onLoad]);

  if (!artistName) return null;

  return (
    <div>
      <h2>Плейлісти {artistName}</h2>
      <PlaylistList 
        playlists={playlists || []} 
        isLoading={isLoadingPlaylists} 
        onSelect={setSelectedPlaylistId} 
      />

      {selectedPlaylistId && (
        <PlaylistTracks 
          tracks={playlistData?.tracks?.data || []} 
          isLoading={isLoadingTracks} 
        />
      )}
    </div>
  );
};

export default ArtistPlaylists;