import styles from './PlaylistList.module.css';

interface Playlist {
    id: number;
    title: string;
    creation_date: string; // зміна тут
    picture_medium: string;
}

interface PlaylistListProps {
    playlists: Playlist[];
    onSelect: (id: number) => void;
    selectedId?: number; // нове поле
}

const PlaylistList: React.FC<PlaylistListProps> = ({
    playlists,
    onSelect,
    selectedId,
}) => {
    return (
        <div className={styles.listWrapper}>
            {playlists.map((playlist) => (
                <div
                    key={playlist.id}
                    className={`${styles.card} ${
                        playlist.id === selectedId ? styles.active : ''
                    }`}
                    onClick={() => onSelect(playlist.id)}
                >
                    <img
                        src={playlist.picture_medium}
                        alt={playlist.title}
                        className={styles.image}
                    />
                    <div className={styles.info}>
                        <h3 className={styles.title} title={playlist.title}>{playlist.title}</h3>
                        <p className={styles.trackDate}>
                            {new Date(playlist.creation_date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PlaylistList;
