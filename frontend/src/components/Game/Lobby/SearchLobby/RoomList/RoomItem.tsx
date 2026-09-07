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
            <div>
                <p className={styles.roomTitle}>
                    Room №{room.id}
                    {room.lobbyOptions?.gameMode === 'HEARDLE' && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', background: 'rgba(0,243,255,0.2)', color: '#00f3ff', padding: '2px 8px', borderRadius: '10px', border: '1px solid #00f3ff', fontWeight: 700 }}>
                            ⏱️ Heardle
                        </span>
                    )}
                    {room.lobbyOptions?.answerMode === 'TYPE_IN' && (
                        <span style={{ marginLeft: '6px', fontSize: '12px', background: 'rgba(241,91,181,0.2)', color: '#f15bb5', padding: '2px 8px', borderRadius: '10px', border: '1px solid #f15bb5', fontWeight: 700 }}>
                            ⌨️ Hardcore
                        </span>
                    )}
                </p>
                <p className={styles.playersHeader}>
                    Players ({room.players.length}/{room.lobbyOptions.maxPlayers})
                </p>
            </div>

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