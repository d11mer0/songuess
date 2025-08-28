import styles from '../../GameFinished.module.css';

interface Player {
    id: number;
    login: string;
    avatar: string | null;
    totalScore?: number;
}

interface PodiumCardProps {
    player: Player;
    rank: number;
    isYou: boolean;
}

const PodiumCard = ({ player, rank, isYou }: PodiumCardProps) => {
    return (
        <div
            className={`${styles.podiumCard} ${styles[`podium${rank}`]} ${isYou ? styles.youHighlight : ''}`}
        >
            {player.avatar ? (
                <img src={player.avatar} alt={player.login} className={styles.podiumAvatar} />
            ) : (
                <div className={`${styles.podiumAvatar} ${styles.placeholder}`}>
                    {player.login[0]}
                </div>
            )}
            <div className={styles.playerInfo}>
                <span className={styles.podiumName}>
                    {isYou ? 'YOU' : player.login}
                </span>
                <span className={styles.podiumScore}>{player.totalScore?.toFixed(2) ?? 0} pts</span>
            </div>
        </div>
    );
};

export default PodiumCard;