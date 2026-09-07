import styles from '../../GameFinished.module.css';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../../../../assets/avatars/presetAvatars';
import { useTranslation } from '../../../../../i18n/LanguageContext';

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
    const { t } = useTranslation();
    return (
        <div
            className={`${styles.playerCard} ${isYou ? styles.youHighlight : ''}`}
        >
            <div className={styles.rankNumber}>{rank}</div>
            <img
                src={getAvatarUrl(player.avatar)}
                alt={player.login}
                className={styles.playerAvatar}
                onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                }}
            />
            <span className={styles.playerName}>
                {isYou ? t('gameplay.youUpper') : player.login}
            </span>
            <span className={styles.playerScore}>
                {player.totalScore?.toFixed(2) ?? 0} pts
            </span>
        </div>
    );
};

export default PlayerCard;
