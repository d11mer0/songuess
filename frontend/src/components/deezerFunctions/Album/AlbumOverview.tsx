import { useGetAlbumByIdQuery } from "../../../store/api/deezerApi";
import TrackList from "../Track/TrackList";

interface AlbumOverviewProps {
  albumId: number;
  hideAlbumInfo?: boolean;
}

interface Track {
  id: number;
  title: string;
  preview: string;
}

const AlbumOverview: React.FC<AlbumOverviewProps> = ({ albumId, hideAlbumInfo = false }) => {
  const { data: albumData, isLoading, error } = useGetAlbumByIdQuery(albumId, { skip: !albumId });

  if (isLoading) return <p>Завантаження...</p>;
  if (error) return <p style={{ color: "red" }}>Помилка завантаження альбому</p>;
  if (!albumData) return null;

  const tracks = albumData.tracks?.data.map((track: Track) => ({
    id: track.id,
    title: track.title,
    preview: track.preview,
  })) || [];

  return (
    <div>
      {!hideAlbumInfo && (
        <>
          <h3>{albumData.title}</h3>
          <img src={albumData.cover_big} alt={albumData.title} width="200" />
          <p>Виконавець: {albumData.artist.name}</p>
        </>
      )}

      <TrackList title="Треки альбому" tracks={tracks} isLoading={isLoading} />
    </div>
  );
};

export default AlbumOverview;