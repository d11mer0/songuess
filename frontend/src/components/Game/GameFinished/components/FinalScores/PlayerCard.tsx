import styles from '../../GameFinished.module.css';

interface Player {
    id: number;
    login: string;
    avatar: string | null;
    totalScore?: number;
}

interface PlayerCardProps {
    player: Player;
    rank: number;
    isYou: boolean;
}

const PlayerCard = ({ player, rank, isYou }: PlayerCardProps) => {
    return (
        <div
            className={`${styles.playerCard} ${isYou ? styles.youHighlight : ''}`}
        >
            <div className={styles.rankNumber}>{rank}</div>
            {player.avatar ? (
                <img src={player.avatar} alt={player.login} className={styles.playerAvatar} />
            ) : (
                <div className={`${styles.playerAvatar} ${styles.placeholder}`}>
                    {player.login[0]}
                </div>
            )}
            <span className={styles.playerName}>
                {isYou ? 'YOU' : player.login}
            </span>
            <span className={styles.playerScore}>
                {player.totalScore?.toFixed(2) ?? 0} pts
            </span>
        </div>
    );
};

export default PlayerCard;
