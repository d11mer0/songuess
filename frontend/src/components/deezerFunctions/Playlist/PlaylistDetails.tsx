interface PlaylistDetailsProps {
    details: {
        title: string;
        picture_big: string;
        description?: string;
    };
}

const PlaylistDetails: React.FC<PlaylistDetailsProps> = ({ details }) => {
    return (
        <div>
            <h3>{details.title}</h3>
            <img
                src={details.picture_big || 'https://via.placeholder.com/150'}
                alt={details.title}
                style={{ width: '200px', borderRadius: '8px' }}
            />
            {details.description && <p>{details.description}</p>}
        </div>
    );
};

export default PlaylistDetails;
