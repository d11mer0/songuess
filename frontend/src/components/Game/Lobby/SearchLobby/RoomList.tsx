import { selectRooms } from '../../../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../../../store/hooks';
import Button from '../../../UI/Button/Button';
import styles from './RoomList.module.css';

interface Props {
    joinRoom: (roomId: string) => void;
}

const RoomList = ({ joinRoom }: Props) => {
    const rooms = useAppSelector(selectRooms);

    return (
        <div className={styles.roomListContainer}>
            <h3 className={styles.sectionTitle}>Available rooms</h3>

            {rooms.length > 0 ? (
                <ul className={styles.roomList}>
                    {rooms.map((room) => (
                        <li key={room.id} className={styles.roomItem}>
                            <p className={styles.roomTitle}>Room №{room.id}</p>
                            <p className={styles.playersHeader}>
                                Players 
                                ({room.players.length}/{room.lobbyOptions.maxPlayers})
                            </p>
                            <ul className={styles.playerLoginsList}>
                                {room.players.map((player) => (
                                    <li
                                        key={player.login}
                                        className={styles.playerLogin}
                                    >
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                marginRight: '6px',
                                                backgroundColor: player.isOnline === true ? '#4caf50' : '#777',
                                            }}
                                        />
                                        {player.login}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant="secondary"
                                style={{
                                    borderRadius: '40px',
                                    width: '40px',
                                    height: '40px',
                                    fontSize: '28px',
                                    padding: '0px',
                                }}
                                onClick={() => joinRoom(room.id)}
                            >
                                +
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.noRooms}>No available rooms</p>
            )}
        </div>
    );
};

export default RoomList;