import { selectRooms } from '../../../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../../../store/hooks';
import Button from '../../../UI/Button/Button';
import styles from '../GameLobby.module.css';

interface Props {
    joinRoom: (roomId: string) => void;
}

const RoomList = ({ joinRoom }: Props) => {
    const rooms = useAppSelector(selectRooms);

    return (
        <div className={styles.roomListContainer}>
            <h3 className={styles.sectionTitle}>Доступні кімнати</h3>

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
                                    <li key={player.login}>
                                        {player.login}
                                    </li>
                                ))}
                            </ul>

                            <p className={styles.roomPlayersCountCentered}>
                                
                            </p>

                            <Button
                                variant="secondary"
                                style={{
                                    borderRadius: '40px',
                                    width: '40px',
                                    height: '40px',
                                    fontSize: '22px',
                                    padding: '0px',
                                    margin: '0px',
                                }}
                                onClick={() => joinRoom(room.id)}
                            >
                                +
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.noRooms}>Наразі немає доступних кімнат</p>
            )}
        </div>
    );
};

export default RoomList;