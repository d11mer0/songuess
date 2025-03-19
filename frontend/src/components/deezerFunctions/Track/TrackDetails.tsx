import { useEffect, useRef } from "react";
import { useGetTrackByIdQuery } from "../../../store/api/deezerApi";

interface Artist {
  id: number;
  name: string;
}

interface Album {
  id: number;
  title: string;
  cover_medium: string;
}

interface Track {
  id: number;
  title: string;
  artist: Artist;
  album: Album;
  preview: string;
}

interface TrackDetailsProps {
  trackId: number;
}

const TrackDetails: React.FC<TrackDetailsProps> = ({ trackId }) => {
  const { data: trackInfo, isLoading, error } = useGetTrackByIdQuery(trackId, { skip: !trackId });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [trackInfo?.preview]);

  if (isLoading) return <p>Завантаження деталей треку...</p>;
  if (error) return <p style={{ color: "red" }}>Помилка завантаження треку</p>;
  if (!trackInfo) return null;

  return (
    <div>
      <h3>{trackInfo.title}</h3>
      <p>Виконавець: {trackInfo.artist.name}</p>
      <p>Альбом: {trackInfo.album.title}</p>
      <img src={trackInfo.album.cover_medium} alt={trackInfo.title} width="200" />

      {trackInfo.preview && (
        <audio ref={audioRef} controls key={trackInfo.preview} style={{ marginTop: "10px" }}>
          <source src={trackInfo.preview} type="audio/mpeg" />
          Ваш браузер не підтримує аудіо-тег.
        </audio>
      )}
    </div>
  );
};

export default TrackDetails;