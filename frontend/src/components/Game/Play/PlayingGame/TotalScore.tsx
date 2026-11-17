import { useMemo, memo, useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './TotalScore.module.css';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../../../assets/avatars/presetAvatars';
import { FaCrown, FaStar, FaTrophy } from 'react-icons/fa';
import { socketHandlers } from '../../../../services/socket';

const TotalScore = memo(() => {
    const { t } = useTranslation();
    const currentRoom = useAppSelector(selectCurrentRoom);
    const { user } = useAppSelector((state) => state.user);

    const [reactions, setReactions] = useState<Record<number, { emoji: string; key: number }>>({});
    const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        const handleReaction = (data: { playerId: number; emoji: string; timestamp: number }) => {
            if (!data?.playerId || !data?.emoji) return;
            if (timersRef.current[data.playerId]) {
                clearTimeout(timersRef.current[data.playerId]);
            }
            setReactions((prev) => ({
                ...prev,
                [data.playerId]: { emoji: data.emoji, key: data.timestamp || Date.now() },
            }));
            timersRef.current[data.playerId] = setTimeout(() => {
                setReactions((prev) => {
                    const next = { ...prev };
                    delete next[data.playerId];
                    return next;
                });
            }, 2500);
        };

        socketHandlers.on('playerReaction', handleReaction);
        return () => {
            socketHandlers.off('playerReaction', handleReaction);
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, []);

    const sortedPlayers = useMemo(
        () => currentRoom ? [...currentRoom.players].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)) : [],
        [currentRoom?.players]
    );

    if (!currentRoom) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <FaTrophy className={styles.trophyIcon} />
                    <span>{t('gameplay.totalScoresTitle')}</span>
                </h2>
                <span className={styles.playerCountBadge} title={`${sortedPlayers.length} players`}>
                    👥 {sortedPlayers.length}
                </span>
            </div>

            <ul className={styles.list}>
                {sortedPlayers.map((player, index) => {
                    const playerScore = player.totalScore ?? 0;
                    const playerStreak = player.streak ?? 0;
                    const hasStreak = playerStreak >= 3;
                    const rankClass =
                        index === 0 ? styles.top1 :
                        index === 1 ? styles.top2 :
                        index === 2 ? styles.top3 : styles.topNormal;
                    const isMe = player.id === user?.id;

                    return (
                        <li
                            key={player.id}
                            className={`${styles.item} ${isMe ? styles.me : ''} ${hasStreak ? styles.onStreakItem : ''}`}
                        >
                            <div className={`${styles.rank} ${rankClass}`} title={`Rank ${index + 1}`}>
                                {index === 0 ? (
                                    <FaCrown className={styles.crownIcon} />
                                ) : (
                                    <span className={styles.rankNum}>{index + 1}</span>
                                )}
                            </div>

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
                                    {hasStreak && (
                                        <span className={styles.flameIconMini} title={`Streak x${playerStreak}`}>
                                            🔥
                                        </span>
                                    )}
                                    {reactions[player.id] && (
                                        <span key={reactions[player.id].key} className={styles.reactionBubble}>
                                            {reactions[player.id].emoji}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.playerInfo}>
                                    <div className={styles.nameRow}>
                                        {(player as any).isPremium && (
                                            <FaStar className={styles.premiumStar} title="Premium" />
                                        )}
                                        <span
                                            className={`${styles.name} ${isMe ? styles.nameMe : ''}`}
                                            style={{
                                                color: (player as any).nameColor || ((player as any).isPremium ? '#ffd700' : undefined),
                                                textShadow: (player as any).isPremium ? '0 0 8px rgba(255, 215, 0, 0.6)' : undefined,
                                            }}
                                            title={player.login}
                                        >
                                            {isMe ? t('gameplay.youUpper') : player.login}
                                        </span>
                                    </div>
                                    {hasStreak && (
                                        <div className={styles.streakWrapper}>
                                            <span className={`${styles.streakPill} ${playerStreak >= 5 ? styles.superStreakPill : ''}`}>
                                                🔥 x{playerStreak}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.scoreBlock}>
                                <span className={styles.scoreValue}>
                                    {playerScore.toFixed(playerScore % 1 === 0 ? 0 : 1)}
                                </span>
                                <span className={styles.scoreUnit}>
                                    {t('common.pts')}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
});

export default TotalScore;