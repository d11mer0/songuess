import styles from './JoinedLobby.module.css';
import RoomPlayerList from './RoomPlayerList';
import InviteLink from './InviteLink';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';
import Button from '../../../UI/Button/Button';
import { useTranslation } from '../../../../i18n/LanguageContext';

interface Props {
    startGame: () => void;
    leaveRoom: () => void;
    kickMember: (memberId: number) => void;
}

const CurrentRoom = ({ startGame, leaveRoom, kickMember }: Props) => {
    const { t } = useTranslation();
    const { user } = useAppSelector(state => state.user);
    const roomInfo = useAppSelector(selectCurrentRoom);

    if(!roomInfo) return <div>{t('gameplay.noRoomsAvailable')}</div>;
    return (
        <div className={styles.roomContainer}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h3 className={styles.roomTitle} style={{ marginBottom: '8px' }}>
                    {t('gameplay.roomNumber')}{roomInfo.id}
                </h3>
                {roomInfo.shortCode && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 16px',
                        background: 'rgba(0, 243, 255, 0.1)',
                        border: '1px solid rgba(0, 243, 255, 0.4)',
                        borderRadius: '20px',
                        color: '#00f3ff',
                        fontSize: '14px',
                        fontWeight: 700,
                        letterSpacing: '1px'
                    }}>
                        <span>{t('joinPage.roomCode')}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', letterSpacing: '2px' }}>
                            {roomInfo.shortCode.toUpperCase()}
                        </span>
                    </div>
                )}
            </div>
            <RoomPlayerList
                kickMember={kickMember}
            />
            <div className={styles.buttonGroup}>
                <InviteLink roomId={roomInfo.id} shortCode={roomInfo.shortCode} />
                <Button variant="danger" onClick={leaveRoom}>
                    {t('gameplay.leaveRoom')}
                </Button>

                {roomInfo.leaderId === user?.id && (
                    <Button variant="primary" onClick={startGame}>
                        {t('gameplay.startGame')}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CurrentRoom;
