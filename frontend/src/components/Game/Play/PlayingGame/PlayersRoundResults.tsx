import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom, selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './PlayerRoundResults.module.css';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../../../assets/avatars/presetAvatars';

const PlayersRoundResults = () => {
    const { t } = useTranslation();
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

        return (a.timeTaken ?? 999999) - (b.timeTaken ?? 999999);
    });

    return (
        <div className={styles.playersResultsWrapper}>
            {sortedResults.map((r, index) => {
                const player = currentRoom.players.find(p => p.id === r.playerId);
                if (!player) return null;

                const isCurrentPlayer = r.playerId === user?.id;
                const noAnswer = r.timeTaken === null;
                const isFirstCorrect = index === 0 && r.isCorrect;
                const playerStreak = r.streak ?? 0;
                const hasStreak = playerStreak >= 3;

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
                            ${isFirstCorrect ? styles.fastestPlayer : ''}
                            ${hasStreak ? styles.onStreakCard : ''}`
                        }
                    >                                        
                        <div className={`${styles.avatarContainer} ${hasStreak ? styles.flameAura : ''}`}>
                            <img
                                src={getAvatarUrl(player.avatar)}
                                alt={player.login}
                                className={styles.playerAvatar}
                                onError={(e) => {
                                    e.currentTarget.src = DEFAULT_AVATAR;
                                }}
                            />
                            {hasStreak && (
                                <span className={styles.flameIcon}>🔥</span>
                            )}
                        </div>

                        <p className={styles.playerName}>
                            {isCurrentPlayer ? t('gameplay.youUpper') : player.login}
                        </p>

                        {hasStreak && (
                            <div className={`${styles.streakBadge} ${playerStreak >= 5 ? styles.superStreak : ''}`}>
                                🔥 x{playerStreak} {playerStreak >= 5 ? `${t('gameplay.onFire')} (2x)` : '(1.5x)'}
                            </div>
                        )}

                        {!noAnswer && r.isCorrect && (
                            <h2 className={styles.playerScore}>
                                +{r.score.toFixed(2)} {t('gameplay.points')}
                            </h2>
                        )}

                        {!noAnswer ? (
                            <>
                                {r.isCorrect === false && <div className={styles.incorrectText}>{t('gameplay.incorrectAnswer')}</div>}
                                <div className={styles.playerTime}>
                                    {t('gameplay.timeTaken')} {typeof r.timeTaken === 'number'
                                        ? `${(r.timeTaken / 1000).toFixed(2)}s`
                                        : '—'}
                                </div>
                            </>
                            
                        ) : (
                            <div className={styles.incorrectText}>{t('gameplay.lateWithAnswer')}</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PlayersRoundResults;