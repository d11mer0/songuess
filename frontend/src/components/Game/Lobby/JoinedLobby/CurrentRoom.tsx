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
            <h3 className={styles.roomTitle}>{t('gameplay.roomNumber')}{roomInfo.id}</h3>
            <RoomPlayerList
                kickMember={kickMember}
            />
            <div className={styles.buttonGroup}>
                <InviteLink roomId={roomInfo.id} />
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
