import { Room, RoomState } from '../../../../../types/roomTypes';
import PlayerList from './PlayerList';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import styles from '../RoomList.module.css';

interface Props {
    room: Room;
    index: number;
    onJoin: (roomId: string) => void;
}

const RoomItem = ({ room, index, onJoin }: Props) => {
    const { t } = useTranslation();

    const maxPlayers = room.lobbyOptions?.maxPlayers || 4;
    const currentPlayers = room.players?.length || 0;
    const isFull = currentPlayers >= maxPlayers;
    const isInGame = room.state === RoomState.STARTED;

    // Localized Room title: e.g. "Кімната №1"
    const title = t('lobby.roomItemTitle', { index: String(index) });

    return (
        <li className={`${styles.roomItem} ${isFull ? styles.roomItemFull : ''}`}>
            {/* Top header: Room title and status badge */}
            <div className={styles.roomHeader}>
                <div className={styles.roomTitleGroup}>
                    <h4 className={styles.roomTitle}>{title}</h4>
                    <span className={styles.roomCodeBadge} title={t('lobby.clickToCopy')}>
                        #{room.shortCode || room.id}
                    </span>
                </div>

                <div className={styles.statusBadgeGroup}>
                    {isInGame ? (
                        <span className={styles.statusInGame}>🔴 {t('lobby.roomInGame')}</span>
                    ) : isFull ? (
                        <span className={styles.statusFull}>🔒 {t('lobby.roomFull')}</span>
                    ) : (
                        <span className={styles.statusWaiting}>🟢 {t('lobby.roomWaiting')}</span>
                    )}
                </div>
            </div>

            {/* Game mode and answer tags */}
            <div className={styles.roomTags}>
                <span className={styles.durationTag}>
                    ⏱️ {room.lobbyOptions?.roundDuration || 25}{t('common.secondsShort')}
                </span>
                <span className={styles.modeTag}>
                    {room.lobbyOptions?.gameMode === 'HEARDLE'
                        ? t('lobby.modeHeardle')
                        : t('lobby.modeClassic')}
                </span>
                <span className={styles.answerTag}>
                    {room.lobbyOptions?.answerMode === 'TYPE_IN'
                        ? t('lobby.modeHardcore')
                        : t('lobby.modeOptions')}
                </span>
                {room.lobbyOptions?.isPartyMode && (
                    <span className={styles.partyTag}>{t('party.partyTag')}</span>
                )}
            </div>

            {/* Players list */}
            <div className={styles.playersSection}>
                <div className={styles.playersHeaderRow}>
                    <span className={styles.playersLabel}>
                        {t('lobby.playersInRoom', {
                            current: String(currentPlayers),
                            max: String(maxPlayers),
                        })}
                    </span>
                    <span className={styles.playersCounter}>
                        👤 {currentPlayers}/{maxPlayers}
                    </span>
                </div>

                <PlayerList
                    players={room.players || []}
                    leaderId={room.leaderId}
                    maxPlayers={maxPlayers}
                />
            </div>

            {/* Action button */}
            <div className={styles.cardActions}>
                <button
                    type="button"
                    className={`${styles.joinRoomBtn} ${isFull || isInGame ? styles.disabledBtn : ''}`}
                    onClick={() => !isFull && !isInGame && onJoin(room.id)}
                    disabled={isFull || isInGame}
                >
                    {isFull ? (
                        `🔒 ${t('lobby.roomFull')}`
                    ) : isInGame ? (
                        `⏳ ${t('lobby.roomInGame')}`
                    ) : (
                        `🚪 ${t('lobby.joinBtn')}`
                    )}
                </button>
            </div>
        </li>
    );
};

export default RoomItem;