import styles from '../../GameFinished.module.css';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../../../../assets/avatars/presetAvatars';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { FaStar } from 'react-icons/fa';

interface Player {
    id: number;
    login: string;
    avatar: string | null;
    totalScore?: number;
    isPremium?: boolean;
    nameColor?: string;
}

interface PlayerCardProps {
    player: Player;
    rank: number;
    isYou: boolean;
}

const PlayerCard = ({ player, rank, isYou }: PlayerCardProps) => {
    const { t } = useTranslation();
    const roundedScore = Math.round(player.totalScore ?? 0);

    return (
        <div
            className={`${styles.playerCard} ${isYou ? styles.playerCardYou : ''}`}
        >
            <div className={styles.rankNumberBadge}>{rank}</div>
            <img
                src={getAvatarUrl(player.avatar)}
                alt={player.login}
                className={styles.playerAvatar}
                onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                }}
            />
            <div className={styles.playerNameBlock}>
                {(player as any).isPremium && (
                    <FaStar className={styles.premiumStar} title="Premium" />
                )}
                <span className={`${styles.playerName} ${isYou ? styles.playerNameYou : ''}`}>
                    {isYou ? t('gameplay.youUpper') : player.login}
                </span>
                {isYou && <span className={styles.miniYouBadge}>{t('gameplay.youUpper')}</span>}
            </div>
            <div className={styles.playerScoreChip}>
                <span className={styles.scoreVal}>{roundedScore}</span>
                <span className={styles.scoreUnit}>{t('common.pts')}</span>
            </div>
        </div>
    );
};

export default PlayerCard;
