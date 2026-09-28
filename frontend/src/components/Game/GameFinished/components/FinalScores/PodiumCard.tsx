import styles from '../../GameFinished.module.css';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../../../../assets/avatars/presetAvatars';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { FaCrown, FaMedal, FaStar } from 'react-icons/fa';

interface Player {
    id: number;
    login: string;
    avatar: string | null;
    totalScore?: number;
    isPremium?: boolean;
    nameColor?: string;
}

interface PodiumCardProps {
    player: Player;
    rank: number;
    isYou: boolean;
}

const PodiumCard = ({ player, rank, isYou }: PodiumCardProps) => {
    const { t } = useTranslation();
    const roundedScore = Math.round(player.totalScore ?? 0);

    const renderBadge = () => {
        if (rank === 1) {
            return (
                <div className={styles.podiumPlaceBadge1}>
                    <FaCrown className={styles.placeBadgeIcon} />
                    <span>1ST</span>
                </div>
            );
        }
        if (rank === 2) {
            return (
                <div className={styles.podiumPlaceBadge2}>
                    <FaMedal className={styles.placeBadgeIcon} />
                    <span>2ND</span>
                </div>
            );
        }
        return (
            <div className={styles.podiumPlaceBadge3}>
                <FaMedal className={styles.placeBadgeIcon} />
                <span>3RD</span>
            </div>
        );
    };

    return (
        <div
            className={`${styles.podiumCard} ${styles[`podium${rank}`]} ${isYou ? styles.youHighlight : ''}`}
        >
            {/* Top Place Badge */}
            <div className={styles.podiumBadgeWrapper}>
                {renderBadge()}
                {isYou && (
                    <span className={styles.youIndicator}>
                        {t('gameplay.youUpper')}
                    </span>
                )}
            </div>

            {/* Avatar */}
            <div className={styles.podiumAvatarWrapper}>
                <img
                    src={getAvatarUrl(player.avatar)}
                    alt={player.login}
                    className={styles.podiumAvatar}
                    onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                />
            </div>

            {/* Player Info */}
            <div className={styles.playerInfo}>
                <div className={styles.podiumNameRow}>
                    {(player as any).isPremium && (
                        <FaStar className={styles.premiumStar} title="Premium" />
                    )}
                    <span
                        className={`${styles.podiumName} ${isYou ? styles.podiumNameYou : ''}`}
                        style={{
                            color: (player as any).nameColor || ((player as any).isPremium ? '#ffd700' : undefined),
                        }}
                        title={player.login}
                    >
                        {isYou ? t('gameplay.youUpper') : player.login}
                    </span>
                </div>

                {/* Rounded Score Chip (without .00) */}
                <div className={`${styles.podiumScoreChip} ${styles[`podiumScoreChip${rank}`]}`}>
                    <span className={styles.podiumScoreVal}>{roundedScore}</span>
                    <span className={styles.podiumScoreUnit}>{t('common.pts')}</span>
                </div>
            </div>
        </div>
    );
};

export default PodiumCard;