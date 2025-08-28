import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom, selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import styles from './PlayerRoundResults.module.css';

const PlayersRoundResults = () => {
    const currentRoom = useAppSelector(selectCurrentRoom);
    const roundResult = useAppSelector(selectRoundResult);


    const { user } = useAppSelector((state) => state.user);

    if (!currentRoom || !roundResult) return null;

    const sortedResults = [...roundResult.results].sort((a, b) => {
        if (a.isCorrect && !b.isCorrect) return -1;
        if (!a.isCorrect && b.isCorrect) return 1;

        const aNoAnswer = a.timeTaken === null;
        const bNoAnswer = b.timeTaken === null;
        if (aNoAnswer && !bNoAnswer) return 1;
        if (!aNoAnswer && bNoAnswer) return -1;

        if (typeof a.timeTaken === 'number' && typeof b.timeTaken === 'number') {
            return a.timeTaken - b.timeTaken;
        }
        return 0;
    });

    const firstCorrectId = sortedResults.find(r => r.isCorrect)?.playerId;

    return (
        <div className={styles.playersResultsWrapper}>
            {sortedResults.map(r => {
                const player = currentRoom.players.find(p => p.id === r.playerId);
                if (!player) return null;

                const isCurrentPlayer = r.playerId === user?.id;
                const noAnswer = r.timeTaken === null;
                const isFirstCorrect = r.playerId === firstCorrectId;

                let statusClass = '';
                if (r.isCorrect) statusClass = styles.correctAnswer;
                else if (noAnswer) statusClass = styles.noAnswer;
                else statusClass = styles.incorrectAnswer;

                return (
                    <div
                        key={r.playerId}
                        className={`
                            ${styles.playerCard} 
                            ${statusClass} 
                            ${isCurrentPlayer ? styles.currentPlayer : ''} 
                            ${isFirstCorrect ? styles.fastestPlayer : ''}`
                        }
                    >                                        
                        {player.avatar && (
                            <img src={player.avatar} alt={player.login} className={styles.playerAvatar} />
                        )}
                        <p className={styles.playerName}>
                            {isCurrentPlayer? 'YOU' : player.login}
                        </p>

                        {!noAnswer && r.isCorrect && (
                            <h2 className={styles.playerScore}>
                                +{r.score.toFixed(2)} points
                            </h2>
                        )}

                        {!noAnswer ? (
                            <>
                                {r.isCorrect === false && <div className={styles.incorrectText}>Incorrect answer</div>}
                                <div className={styles.playerTime}>
                                    Time: {typeof r.timeTaken === 'number'
                                        ? `${(r.timeTaken / 1000).toFixed(2)}s`
                                        : '—'}
                                </div>
                            </>
                            
                        ) : (
                            <div className={styles.incorrectText}>Late with the answer</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PlayersRoundResults;
