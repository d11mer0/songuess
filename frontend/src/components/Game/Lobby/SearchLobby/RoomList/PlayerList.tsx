import { Player } from '../../../../../types/roomTypes';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import styles from '../RoomList.module.css';

interface Props {
    players: Player[];
    leaderId?: number;
    maxPlayers?: number;
}

const PlayerList = ({ players, leaderId, maxPlayers = 4 }: Props) => {
    const { t } = useTranslation();
    const safePlayers = players || [];
    const openSlots = Math.max(0, maxPlayers - safePlayers.length);

    return (
        <ul className={styles.playerLoginsList}>
            {safePlayers.map((player) => {
                const isLeader = leaderId !== undefined && player.id === leaderId;
                const initial = (player.login || '?').charAt(0).toUpperCase();

                return (
                    <li key={player.login || player.id} className={styles.playerLogin}>
                        <div className={styles.playerAvatarWrapper}>
                            {player.avatar ? (
                                <img
                                    src={player.avatar}
                                    alt={player.login}
                                    className={styles.playerAvatar}
                                />
                            ) : (
                                <span className={styles.playerAvatarPlaceholder}>{initial}</span>
                            )}
                            <span
                                className={`${styles.playerStatusDot} ${
                                    player.isOnline ? styles.online : styles.offline
                                }`}
                            />
                        </div>

                        <span className={styles.playerLoginText}>
                            {player.login}
                            {isLeader && <span className={styles.hostCrown} title="Host">👑</span>}
                        </span>
                    </li>
                );
            })}

            {openSlots > 0 && (
                <li className={styles.openSlotRow}>
                    <span className={styles.openSlotDot}>+</span>
                    <span className={styles.openSlotText}>
                        {openSlots} {t('lobby.openSlot')}
                    </span>
                </li>
            )}
        </ul>
    );
};

export default PlayerList;
