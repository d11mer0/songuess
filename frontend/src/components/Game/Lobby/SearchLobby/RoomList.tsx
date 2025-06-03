import { selectRooms } from '../../../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../../../store/hooks';
import styles from '../GameLobby.module.css';

interface Props {
    joinRoom: (roomId: string) => void;
}

const RoomList = ({ joinRoom }: Props) => {
    const rooms = useAppSelector(selectRooms);
    return (
        <div>
            <h3>Доступні кімнати:</h3>
            {rooms.length > 0 ? (
                <ul>
                    {rooms.map((room) => (
                        <li key={room.id}>
                            Кімната {room.id} ({room.players.length}/
                            {room.lobbyOptions.maxPlayers} гравців)
                            <button
                                onClick={() => joinRoom(room.id)}
                                className={styles.button}
                            >
                                Приєднатися
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Немає доступних кімнат</p>
            )}
        </div>
    );
};

export default RoomList;
