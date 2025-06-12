import { useGameplay } from '../../hooks/Gameplay/useGameplay';
import { RoomState } from '../../types/roomTypes';
import CreatingGame from '../../components/Game/Creating/CreatingGame';
import PlayingGame from '../../components/Game/Play/PlayingGame';
import PlayerList from '../../components/Game/Lobby/PlayerList/PlayerList';
import GameFinished from '../../components/Game/GameFinished/GameFinished';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../store/hooks';

const Gameplay = () => {
     const { user } = useAppSelector((state) => state.user);
    const currentRoom = useAppSelector(selectCurrentRoom);

    const { kickMember, deleteRoom, launchGame, submitAnswer } = useGameplay();
    
    if (!currentRoom) return <div>No active rooms</div>;
    
    return (
        <div>
            <h2>Gameplay</h2>
            <div>
                <h3>Room №{currentRoom.id}</h3>
                
                <PlayerList onKick={kickMember} />

                {currentRoom?.leaderId === user?.id && (
                    <button onClick={deleteRoom}>Finish game</button>
                )}
                <div style={{ marginTop: '100px' }}>
                    {(() => {
                        switch (currentRoom.state) {
                            case RoomState.CREATING:
                                return <CreatingGame startGame={launchGame} />;
                            case RoomState.STARTED:
                                return <PlayingGame onSubmitAnswer={submitAnswer}/>;
                            case RoomState.ENDED:
                                return <GameFinished />;
                            default:
                                return <p>Unkonwn state</p>;
                        }
                    })()}
                </div>
            </div>
        </div>
    );
};

export default Gameplay;
