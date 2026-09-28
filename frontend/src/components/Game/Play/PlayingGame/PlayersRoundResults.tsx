import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom, selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './PlayerRoundResults.module.css';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../../../assets/avatars/presetAvatars';
import { FaBolt, FaStar, FaRegClock, FaTimes } from 'react-icons/fa';

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
                const player = currentRoom.players.find((p) => p.id === r.playerId);
                if (!player) return null;

                const isCurrentPlayer = r.playerId === user?.id;
                const noAnswer = r.timeTaken === null;
                const isFirstCorrect = index === 0 && r.isCorrect;
                const playerStreak = r.streak ?? 0;
                const hasStreak = playerStreak >= 3;

                let cardStyle = styles.incorrectCard;
                if (isFirstCorrect) {
                    cardStyle = styles.fastestCard;
                } else if (isCurrentPlayer) {
                    cardStyle = styles.currentCard;
                } else if (r.isCorrect) {
                    cardStyle = styles.correctCard;
                }

                return (
                    <div
                        key={r.playerId}
                        className={`${styles.playerCard} ${cardStyle} ${hasStreak ? styles.onStreakCard : ''}`}
                    >
                        {/* Top Badge */}
                        <div className={styles.badgeRow}>
                            {isFirstCorrect ? (
                                <div className={styles.topBadgeFastest}>
                                    <FaBolt className={styles.boltIcon} />
                                    <span>{t('gameplay.fastest')}</span>
                                </div>
                            ) : isCurrentPlayer ? (
                                <div className={styles.topBadgeYou}>
                                    <span>{t('gameplay.youUpper')}</span>
                                </div>
                            ) : r.isCorrect ? (
                                <div className={styles.topBadgeCorrect}>
                                    <span>{t('gameplay.correct')}</span>
                                </div>
                            ) : (
                                <div className={styles.topBadgeIncorrect}>
                                    <span>{noAnswer ? t('gameplay.noAnswer') : t('gameplay.incorrect')}</span>
                                </div>
                            )}
                        </div>

                        {/* Avatar */}
                        <div className={`${styles.avatarContainer} ${hasStreak ? styles.flameAura : ''}`}>
                            <img
                                src={getAvatarUrl(player.avatar)}
                                alt={player.login}
                                className={styles.playerAvatar}
                                onError={(e) => {
                                    e.currentTarget.src = DEFAULT_AVATAR;
                                }}
                            />
                            {hasStreak && <span className={styles.flameIcon}>🔥</span>}
                        </div>

                        {/* Player Name */}
                        <div className={styles.playerNameRow}>
                            {(player as any).isPremium && (
                                <FaStar className={styles.premiumStar} title="Premium" />
                            )}
                            <span
                                className={`${styles.playerName} ${isCurrentPlayer ? styles.currentName : ''}`}
                                style={{
                                    color: (player as any).nameColor || ((player as any).isPremium ? '#ffd700' : undefined),
                                }}
                                title={player.login}
                            >
                                {isCurrentPlayer ? t('gameplay.youUpper') : player.login}
                            </span>
                        </div>

                        {/* Streak Pill */}
                        {hasStreak && (
                            <div className={`${styles.streakBadge} ${playerStreak >= 5 ? styles.superStreak : ''}`}>
                                🔥 x{playerStreak} {playerStreak >= 5 ? '(2x)' : '(1.5x)'}
                            </div>
                        )}

                        {/* Score Chip without unnecessary .00 */}
                        <div className={styles.scoreRow}>
                            {!noAnswer && r.isCorrect ? (
                                <div
                                    className={`${styles.scoreChip} ${
                                        isFirstCorrect ? styles.scoreChipFastest : styles.scoreChipCorrect
                                    }`}
                                >
                                    <span className={styles.scorePlus}>+</span>
                                    <span className={styles.scoreValue}>{Math.round(r.score)}</span>
                                    <span className={styles.scoreUnit}>{t('common.pts')}</span>
                                </div>
                            ) : (
                                <div className={styles.scoreChipZero}>
                                    <span className={styles.scoreValue}>+0</span>
                                    <span className={styles.scoreUnit}>{t('common.pts')}</span>
                                </div>
                            )}
                        </div>

                        {/* Time Taken */}
                        <div className={styles.timeRow}>
                            {!noAnswer && typeof r.timeTaken === 'number' ? (
                                <div className={styles.timeBadge}>
                                    <FaRegClock className={styles.timeIcon} />
                                    <span>
                                        {(r.timeTaken / 1000).toFixed(2)}
                                        {t('common.secondsShort')}
                                    </span>
                                </div>
                            ) : (
                                <div className={styles.timeBadgeLate}>
                                    <FaTimes className={styles.timeIcon} />
                                    <span>{t('gameplay.lateWithAnswer')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PlayersRoundResults;