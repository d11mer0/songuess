interface Playlist {
    id: number;
    title: string;
    nb_tracks: number;
}

interface PlaylistListProps {
  playlists: Playlist[];
  isLoading: boolean;
  onSelect: (id: number) => void;
}

const PlaylistList: React.FC<PlaylistListProps> = ({ playlists, isLoading, onSelect }) => {
  return (
    <>
      {isLoading ? (
        <p>Завантаження плейлістів...</p>
      ) : (
        <ul>
          {playlists.map((playlist) => (
            <li key={playlist.id} onClick={() => onSelect(playlist.id)} style={{ cursor: "pointer" }}>
              {playlist.title} ({playlist.nb_tracks} треків)
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default PlaylistList;