import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './TotalScore.module.css';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../../../assets/avatars/presetAvatars';

const TotalScore = () => {
    const { t } = useTranslation();
    const currentRoom = useAppSelector(selectCurrentRoom);
    const { user } = useAppSelector((state) => state.user);
    if (!currentRoom) return null;

    const sortedPlayers = [...currentRoom.players].sort(
        (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)
    );
    
    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>{t('gameplay.totalScoresTitle')}</h2>
            <ul className={styles.list}>
                {sortedPlayers.map((player, index) => {
                    const playerScore = player.totalScore ?? 0;
                    const playerStreak = player.streak ?? 0;
                    const hasStreak = playerStreak >= 3;
                    const rankClass =
                        index === 0 ? styles.top1 :
                        index === 1 ? styles.top2 :
                        index === 2 ? styles.top3 : '';
                    const isMe = player.id === user?.id;
                    return (
                        <li 
                            key={player.id}  
                            className={`${styles.item} ${isMe ? styles.me : ''} ${hasStreak ? styles.onStreakItem : ''}`}
                        >
                            <span className={`${styles.rank} ${rankClass}`}>{index + 1}</span>
                            <div className={styles.nameBlock}>
                                <div className={`${styles.avatarContainer} ${hasStreak ? styles.flameAvatar : ''}`}>
                                    <img
                                        src={getAvatarUrl(player.avatar)}
                                        alt={player.login}
                                        className={styles.avatar}
                                        onError={(e) => {
                                            e.currentTarget.src = DEFAULT_AVATAR;
                                        }}
                                    />
                                    {hasStreak && <span className={styles.flameIconMini}>🔥</span>}
                                </div>
                                <div className={styles.playerInfo}>
                                    <span
                                        className={styles.name}
                                        style={{
                                            color: (player as any).nameColor || ((player as any).isPremium ? '#ffd700' : 'inherit'),
                                            textShadow: (player as any).isPremium ? '0 0 8px rgba(255, 215, 0, 0.7)' : 'none',
                                            fontWeight: (player as any).isPremium ? 700 : 500,
                                        }}
                                    >
                                        {(player as any).isPremium && '⭐ '}
                                        {isMe ? t('gameplay.you') : player.login}
                                    </span>
                                    {hasStreak && (
                                        <span className={`${styles.streakPill} ${playerStreak >= 5 ? styles.superStreakPill : ''}`}>
                                            🔥 x{playerStreak}
                                        </span>
                                    )}
                                </div>
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