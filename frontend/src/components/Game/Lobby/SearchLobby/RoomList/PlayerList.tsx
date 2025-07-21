import styles from '../RoomList.module.css';

interface Props {
    players: { login: string; isOnline: boolean }[];
}

const PlayerList = ({ players }: Props) => {
    return (
        <ul className={styles.playerLoginsList}>
            {players.map((player) => (
                <li key={player.login} className={styles.playerLogin}>
                    <span className={`${styles.playerStatusDot} ${
                            player.isOnline ? styles.online : styles.offline
                        }`}
                    />

                    {player.login}
                </li>
            ))}
        </ul>
    );
};

export default PlayerList;
