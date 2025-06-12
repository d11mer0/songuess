import { useGameRoom } from '../../hooks/GameRoom/useGameRoom';
import styles from '../../components/Game/Lobby/SearchLobby/LobbyControls.module.css';
import LobbyControls from '../../components/Game/Lobby/SearchLobby/LobbyControls';
import RoomList from '../../components/Game/Lobby/SearchLobby/RoomList';
import CurrentRoom from '../../components/Game/Lobby/JoinedLobby/CurrentRoom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';

const GameLobby = () => {
    const roomInfo = useAppSelector(selectCurrentRoom);

    const {
        createRoom,
        joinRoom,
        leaveRoom,
        autoJoinRoom,
        startGame,
        kickMember,
    } = useGameRoom();

    return (
        <div className={styles.container}>
            <h2 style={{marginBottom: '50px', color:'#9b5de5', fontSize:'42px'}}>Game lobby</h2>
            {!roomInfo ? (
                <>
                    <LobbyControls
                        createRoom={createRoom}
                        autoJoinRoom={autoJoinRoom}
                    />
                    <RoomList joinRoom={joinRoom} />
                </>
            ) : (
                <CurrentRoom
                    startGame={startGame}
                    leaveRoom={leaveRoom}
                    kickMember={kickMember}
                />
            )}
        </div>
    );
};

export default GameLobby;
