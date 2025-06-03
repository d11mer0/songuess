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
    isList: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
    title,
    tracks,
    isLoading,
    error,
    isList,
}) => {
    if (isLoading) return <p>Завантаження...</p>;
    if (error)
        return <p style={{ color: 'red' }}>Помилка завантаження треків</p>;

    if (isList === true) {
        return (
            <div>
                <h3>{title}</h3>
                <ul>
                    {tracks.map((track) => (
                        <li key={track.id}>
                            {track.title}{' '}
                            {track.artistName ? `- ${track.artistName}` : ''}{' '}
                            {track.albumName ? `(${track.albumName})` : ''}
                            <audio
                                controls
                                src={track.preview}
                                style={{ marginLeft: '10px' }}
                            >
                                Ваш браузер не підтримує аудіо.
                            </audio>
                        </li>
                    ))}
                </ul>
            </div>
        );
    } else {
        return (
            <div>
                You select {tracks.length} songs.
                {tracks.length > 3 && (
                    <>
                        {tracks[0].artistName ? (
                            <>
                                It is include
                                {' ' + tracks[0].title} - {tracks[0].artistName}
                                ,{' ' + tracks[1].title} -{' '}
                                {tracks[1].artistName},{' ' + tracks[2].title} -{' '}
                                {tracks[2].artistName + ' '}
                            </>
                        ) : (
                            <>
                                {' ' + tracks[0].title}, {' ' + tracks[1].title}
                                ,{' ' + tracks[2].title + ' '}{' '}
                            </>
                        )}
                        and far more
                    </>
                )}
            </div>
        );
    }
};

export default TrackList;
