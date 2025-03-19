interface Track {
    id: number;
    title: string;
    preview: string;
    artistName?: string; // Для плейлістів
    albumName?: string; // Для артистів
  }
  
  interface TrackListProps {
    title: string;
    tracks: Track[];
    isLoading: boolean;
    error?: unknown;
  }
  
  const TrackList: React.FC<TrackListProps> = ({ title, tracks, isLoading, error }) => {
    if (isLoading) return <p>Завантаження...</p>;
    if (error) return <p style={{ color: "red" }}>Помилка завантаження треків</p>;
  
    return (
      <div>
        <h3>{title}</h3>
        <ul>
          {tracks.map((track) => (
            <li key={track.id}>
              {track.title} {track.artistName ? `- ${track.artistName}` : ""} {track.albumName ? `(${track.albumName})` : ""}
              <audio controls src={track.preview} style={{ marginLeft: "10px" }}>
                Ваш браузер не підтримує аудіо.
              </audio>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default TrackList;