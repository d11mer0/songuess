import { useState } from "react";
import { useSearchDeezerQuery } from "../../store/api/deezerApi";
import TrackSearch from "../../components/deezerFunctions/Track/TrackSearch";
import TrackDetails from "../../components/deezerFunctions/Track/TrackDetails";

const TrackPage: React.FC = () => {
  const [trackName, setTrackName] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const { data: trackResults, isLoading: isSearching } = useSearchDeezerQuery(
    { query: trackName, type: "track" },
    { skip: trackName.length < 2 }
  );

  return (
    <div className="track-page">
      <h2>Find a Track</h2>

      {/* 🔹 Пошук треку */}
      <TrackSearch
        trackName={trackName}
        setTrackName={setTrackName}
        trackResults={trackResults?.data || []}
        onSelect={setSelectedTrackId}
      />

      {/* 🔹 Деталі треку */}
      {selectedTrackId && <TrackDetails trackId={selectedTrackId} />}
    </div>
  );
};

export default TrackPage;