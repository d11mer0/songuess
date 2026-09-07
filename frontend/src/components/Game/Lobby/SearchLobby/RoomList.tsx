import { selectRooms } from '../../../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../../../store/hooks';
import RoomItem from './RoomList/RoomItem';
import EmptyRoomListState from './RoomList/EmptyRoomListState';
import styles from './RoomList.module.css';
import { useTranslation } from '../../../../i18n/LanguageContext';

interface Props {
    joinRoom: (roomId: string) => void;
}

const RoomList = ({ joinRoom }: Props) => {
    const { t } = useTranslation();
    const rooms = useAppSelector(selectRooms);
    const noRooms = rooms.length === 0;

    return (
        <div
            className={`${styles.roomListContainer} ${noRooms ? styles.emptyState : ''}`}
        >
            {noRooms ? (
                <EmptyRoomListState />
            ) : (
                <>
                    <h3 className={styles.sectionTitle}>{t('lobby.availableRooms')}</h3>
                    <ul className={styles.roomList}>
                        {rooms.map((room) => (
                            <RoomItem key={room.id} room={room} onJoin={joinRoom} />
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default RoomList;
