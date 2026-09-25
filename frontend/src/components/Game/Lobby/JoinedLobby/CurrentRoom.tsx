import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaCopy, FaCheck, FaSignOutAlt, FaTv, FaPlay } from 'react-icons/fa';
import styles from './JoinedLobby.module.css';
import RoomPlayerList from './RoomPlayerList';
import InviteLink from './InviteLink';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';
import { useTranslation } from '../../../../i18n/LanguageContext';
import { useToast } from '../../../UI/Toast/ToastContext';
import { socketEmitter } from '../../../../services/socket';

interface Props {
    startGame: () => void;
    leaveRoom: () => void;
    kickMember: (memberId: number) => void;
}

const CurrentRoom = ({ startGame, leaveRoom, kickMember }: Props) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user } = useAppSelector(state => state.user);
    const roomInfo = useAppSelector(selectCurrentRoom);
    const [isCodeCopied, setIsCodeCopied] = useState(false);

    const handleSwitchToTv = () => {
        if (!roomInfo) return;
        socketEmitter.emit('switchPartyMode', {
            roomId: roomInfo.id,
            isPartyMode: true,
        });
        navigate(`/party/host/${roomInfo.id}`);
    };

    const handleCopyCode = async () => {
        const codeToCopy = roomInfo?.shortCode || roomInfo?.id;
        if (!codeToCopy) return;
        try {
            await navigator.clipboard.writeText(codeToCopy.toUpperCase());
            setIsCodeCopied(true);
            showToast(t('shareModal.codeCopied'), 'success');
            setTimeout(() => setIsCodeCopied(false), 2000);
        } catch {
            showToast(t('common.error'), 'danger');
        }
    };

    if (!roomInfo) return <div className={styles.emptyNotice}>{t('gameplay.noRoomsAvailable')}</div>;

    const isLeader = roomInfo.leaderId === user?.id;

    return (
        <div className={styles.roomContainer}>
            {/* Lobby Header */}
            <div className={styles.lobbyHeader}>
                <div className={styles.lobbyMetaRow}>
                    <span className={styles.lobbyBadge}>
                        {t('lobby.roomLobbyTitle')}
                    </span>
                    <span className={styles.playerCountBadge}>
                        <FaUsers className={styles.metaIcon} />
                        <span>{roomInfo.players.length} / {roomInfo.lobbyOptions.maxPlayers}</span>
                    </span>
                </div>

                {/* Big interactive Room Code Card */}
                <div
                    className={styles.roomCodeCard}
                    onClick={handleCopyCode}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCopyCode();
                        }
                    }}
                >
                    {/* Glowing Interactive Tooltip */}
                    <div className={`${styles.codeTooltip} ${isCodeCopied ? styles.codeTooltipCopied : ''}`}>
                        {isCodeCopied ? (
                            <span>✅ {t('shareModal.codeCopied')}</span>
                        ) : (
                            <span>📋 {t('lobby.clickToCopyCode') || t('lobby.clickToCopy')}</span>
                        )}
                    </div>

                    <div className={styles.codeLabel}>{t('joinPage.roomCode')}</div>
                    <div className={styles.codeDisplay}>
                        <span className={styles.codeText}>
                            {(roomInfo.shortCode || roomInfo.id).toUpperCase()}
                        </span>
                        <span className={`${styles.codeCopyBadge} ${isCodeCopied ? styles.codeCopiedSuccess : ''}`}>
                            {isCodeCopied ? <FaCheck /> : <FaCopy />}
                        </span>
                    </div>
                    {roomInfo.shortCode && (
                        <div className={styles.internalIdHint}>ID: #{roomInfo.id}</div>
                    )}
                </div>
            </div>

            {/* Players Grid with Crown & Role Badges */}
            <RoomPlayerList kickMember={kickMember} />

            {/* Invite & Share Action Bar */}
            <div className={styles.shareSection}>
                <InviteLink roomId={roomInfo.id} shortCode={roomInfo.shortCode} />
            </div>

            {/* Room Settings Info Bar */}
            <div className={styles.roomSettingsBar}>
                <div className={styles.settingTag}>
                    <span className={styles.settingIcon}>⏱️</span>
                    <span className={styles.settingLabel}>{t('lobby.roundDurationLabel')}</span>
                    <span className={styles.settingValue}>
                        {roomInfo.lobbyOptions.roundDuration || 25}{t('common.secondsShort')}
                    </span>
                </div>
                <div className={styles.settingTag}>
                    <span className={styles.settingIcon}>🎮</span>
                    <span className={styles.settingLabel}>{t('lobby.gameModeLabel')}</span>
                    <span className={styles.settingValue}>
                        {roomInfo.lobbyOptions.gameMode === 'HEARDLE'
                            ? t('lobby.modeHeardle')
                            : t('lobby.modeClassic')}
                    </span>
                </div>
                <div className={styles.settingTag}>
                    <span className={styles.settingIcon}>🎯</span>
                    <span className={styles.settingLabel}>{t('lobby.answerModeLabel')}</span>
                    <span className={styles.settingValue}>
                        {roomInfo.lobbyOptions.answerMode === 'TYPE_IN'
                            ? t('lobby.modeHardcore')
                            : t('lobby.modeOptions')}
                    </span>
                </div>
            </div>

            {/* Game Controls Bar */}
            <div className={styles.controlsSection}>
                <button
                    type="button"
                    className={styles.leaveBtn}
                    onClick={leaveRoom}
                    title={t('gameplay.leaveRoom')}
                >
                    <FaSignOutAlt className={styles.btnIcon} />
                    <span>{t('gameplay.leaveRoom')}</span>
                </button>

                {isLeader ? (
                    <div className={styles.leaderBtnGroup}>
                        <button
                            type="button"
                            className={styles.tvBtn}
                            onClick={handleSwitchToTv}
                            title={t('party.hostTitle')}
                        >
                            <FaTv className={styles.btnIcon} />
                            <span>TV</span>
                        </button>
                        <button
                            type="button"
                            className={styles.startBtn}
                            onClick={startGame}
                        >
                            <FaPlay className={styles.btnIcon} />
                            <span>{t('gameplay.startGame')}</span>
                        </button>
                    </div>
                ) : (
                    <div className={styles.waitingForLeader}>
                        <span className={styles.waitingPulseDot} />
                        <span>{t('lobby.waitingForHost')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurrentRoom;
