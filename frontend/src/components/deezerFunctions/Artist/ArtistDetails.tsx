interface ArtistProfileProps {
  artist: {
    id: number;
    name: string;
    picture_big?: string;
  };
}

const ArtistDetails: React.FC<ArtistProfileProps> = ({ artist }) => {
  return (
    <div>
      <h2>{artist.name}</h2>
      <img
        src={artist.picture_big || "https://via.placeholder.com/150"}
        alt={artist.name}
        style={{ width: "150px", borderRadius: "50%" }}
      />
    </div>
  );
};

export default ArtistDetails;
