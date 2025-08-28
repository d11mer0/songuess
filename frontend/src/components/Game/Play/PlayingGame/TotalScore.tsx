import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';
import styles from './TotalScore.module.css';


const TotalScore = () => {
    const currentRoom = useAppSelector(selectCurrentRoom);
    const { user } = useAppSelector((state) => state.user);
    if (!currentRoom) return null;

    const sortedPlayers = [...currentRoom.players].sort(
        (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)
    );
    
    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>Total Scores</h2>
            <ul className={styles.list}>
                {sortedPlayers.map((player, index) => {
                const playerScore = player.totalScore ?? 0;
                const rankClass =
                    index === 0 ? styles.top1 :
                    index === 1 ? styles.top2 :
                    index === 2 ? styles.top3 : '';
                const isMe = player.id === user?.id;
                return (
                    <li 
                        key={player.id}  
                        className={`${styles.item} ${isMe ? styles.me : ''}`}
                    >
                        <span className={`${styles.rank} ${rankClass}`}>{index + 1}</span>
                        <div className={styles.nameBlock}>
                            {player.avatar && (
                            <img
                                src={player.avatar}
                                alt={player.login}
                                className={styles.avatar}
                            />
                            )}
                            <span className={styles.name}>
                                {isMe ? 'You' : player.login}
                            </span>
                        </div>
                        <span className={styles.score}>{playerScore.toFixed(2)}</span>
                    </li>


                );
                })}
            </ul>
        </div>
  );
};

export default TotalScore;