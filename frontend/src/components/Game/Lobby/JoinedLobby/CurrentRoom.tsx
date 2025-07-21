import styles from './JoinedLobby.module.css';
import RoomPlayerList from './RoomPlayerList';
import InviteLink from './InviteLink';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';
import Button from '../../../UI/Button/Button';

interface Props {
    startGame: () => void;
    leaveRoom: () => void;
    kickMember: (memberId: number) => void;
}

const CurrentRoom = ({ startGame, leaveRoom, kickMember }: Props) => {
    const { user } = useAppSelector(state => state.user);
    const roomInfo = useAppSelector(selectCurrentRoom);

    if(!roomInfo) return<div>No room info here</div>;
    return (
        <div className={styles.roomContainer}>
            <h3 className={styles.roomTitle}>Кімната №{roomInfo.id}</h3>
            <RoomPlayerList
                kickMember={kickMember}
            />
            <div className={styles.buttonGroup}>
                <InviteLink roomId={roomInfo.id} />
                <Button variant="danger" onClick={leaveRoom} width='30%'>
                    Leave room
                </Button>

                {roomInfo.leaderId === user?.id && (
                    <Button variant="primary" onClick={startGame} width='35%'>
                        Start game
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CurrentRoom;
