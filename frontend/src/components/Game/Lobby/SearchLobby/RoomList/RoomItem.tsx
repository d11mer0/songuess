import { Room } from '../../../../../types/roomTypes'; // або звідки в тебе тип
import Button from '../../../../UI/Button/Button';
import PlayerList from './PlayerList';
import styles from '../RoomList.module.css';

interface Props {
    room: Room;
    onJoin: (roomId: string) => void;
}

const RoomItem = ({ room, onJoin }: Props) => {
    return (
        <li className={styles.roomItem}>
            <p className={styles.roomTitle}>Room №{room.id}</p>
            <p className={styles.playersHeader}>
                Players ({room.players.length}/{room.lobbyOptions.maxPlayers})
            </p>

            <PlayerList players={room.players} />

            <Button
                variant="secondary"
                isNotAdaptive={true}
                style={{
                    borderRadius: '40px',
                    width: '40px',
                    height: '40px',
                    fontSize: '28px',
                    padding: '0px',
                }}
                onClick={() => onJoin(room.id)}
            >
                +
            </Button>
        </li>
    );
};

export default RoomItem;