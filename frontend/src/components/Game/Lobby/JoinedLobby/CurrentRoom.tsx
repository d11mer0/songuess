import styles from '../GameLobby.module.css';
import RoomPlayerList from './RoomPlayerList';
import InviteLink from './InviteLink';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';

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
        <div>
            <h3>Кімната: {roomInfo.id}</h3>
            <RoomPlayerList
                players={roomInfo.players}
                kickMember={kickMember}
                leaderId={roomInfo.leaderId}
            />
            {roomInfo.leaderId === user?.id && (
                <button onClick={startGame} className={styles.startButton}>
                    Почати гру
                </button>
            )}
            <InviteLink roomId={roomInfo.id} />
            <button onClick={leaveRoom} className={styles.exitButton}>
                Вийти
            </button>
        </div>
    );
};

export default CurrentRoom;
