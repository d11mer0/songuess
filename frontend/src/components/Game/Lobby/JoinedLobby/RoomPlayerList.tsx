import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCrown } from 'react-icons/fa';
import { BsXLg, BsPerson } from 'react-icons/bs';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';
import { getAvatarUrl, DEFAULT_AVATAR } from '../../../../assets/avatars/presetAvatars';
import { useTranslation } from '../../../../i18n/LanguageContext';
import styles from './JoinedLobby.module.css';

interface Props {
    kickMember: (memberId: number) => void;
}

const RoomPlayerList: React.FC<Props> = ({ kickMember }) => {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.user);

    const goToProfile = (targetId: number) => {
        navigate(targetId === user?.id ? '/user/me' : `/user/${targetId}`);
    };
    const roomInfo = useAppSelector(selectCurrentRoom);
    const { t } = useTranslation();
    
    if (!roomInfo) return <div></div>;

    const slotCount = Math.min(20, Math.max(roomInfo.players.length, Number(roomInfo.lobbyOptions?.maxPlayers) || 4));
    const slots = Array.from({ length: slotCount }, (_, index) => roomInfo.players[index] ?? null);

    return (
        <ul className={styles.grid}>
            {slots.map((player, i) => {
                if (!player) {
                    return (
                        <li className={styles.playerSlot} key={i}>
                            <div className={styles.playerInfo}>
                                <div className={styles.avatarWrapper}>
                                    <div className={styles.emptySlot}>
                                        <BsPerson className={styles.emptyIcon} />
                                    </div>
                                </div>
                                <div className={styles.emptyLabel}>
                                    {t('lobby.openSlot')}
                                </div>
                            </div>
                        </li>
                    );
                }

                const isLeader = player.id === roomInfo.leaderId;

                return (
                    <li className={styles.playerSlot} key={player.id || i}>
                        <div className={styles.playerInfo}>
                            <div className={styles.avatarWrapper}>
                                {isLeader && (
                                    <div className={styles.leaderBadge} title={t('lobby.hostBadge')}>
                                        <div className={styles.crownGlow} />
                                        <FaCrown className={styles.crownIcon} />
                                    </div>
                                )}
                                <img
                                    src={getAvatarUrl(player.avatar)}
                                    alt={player.login}
                                    onClick={() => goToProfile(player.id)}
                                    style={{ cursor: 'pointer' }}
                                    className={`${styles.avatar} ${isLeader ? styles.leaderAvatar : ''} ${player.isPremium ? styles.premiumAvatar : ''}`}
                                    onError={(e) => {
                                        e.currentTarget.src = DEFAULT_AVATAR;
                                    }}
                                />
                                {user?.id === roomInfo.leaderId && !isLeader && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); kickMember(player.id); }}
                                        className={styles.kickIcon}
                                        title={`Kick ${player.login}`}
                                    >
                                        <BsXLg />
                                    </button>
                                )}
                                <span
                                    className={`${styles.statusDot} ${player.isOnline ? styles.statusOnline : styles.statusOffline}`}
                                    title={player.isOnline ? 'Online' : 'Offline'}
                                />
                            </div>
                            <div
                                className={styles.login}
                                title={player.login}
                                onClick={() => goToProfile(player.id)}
                                style={{
                                    color: player.nameColor || (player.isPremium ? '#ffd700' : 'inherit'),
                                    textShadow: player.isPremium ? '0 0 8px rgba(255, 215, 0, 0.7)' : 'none',
                                    fontWeight: player.isPremium ? 800 : 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {player.isPremium && '⭐ '}
                                {player.login}
                            </div>
                            <div className={styles.roleTagWrapper}>
                                {isLeader ? (
                                    <span className={styles.hostRoleBadge}>{t('lobby.hostBadge')}</span>
                                ) : (
                                    <span className={styles.playerRoleBadge}>{t('lobby.playerBadge')}</span>
                                )}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default RoomPlayerList;
