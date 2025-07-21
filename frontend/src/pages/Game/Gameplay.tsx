import { useGameplay } from '../../hooks/Gameplay/useGameplay';
import { RoomState } from '../../types/roomTypes';
import CreatingGame from '../../components/Game/Creating/CreatingGame';
import PlayingGame from '../../components/Game/Play/PlayingGame';
import GameFinished from '../../components/Game/GameFinished/GameFinished';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../store/hooks';
import RoomPlayerList from '../../components/Game/Lobby/JoinedLobby/RoomPlayerList';

import styles from './Gameplay.module.css';
import { useState } from 'react';
import Button from '../../components/UI/Button/Button';

const Gameplay = () => {
    const { user } = useAppSelector((state) => state.user);
    const currentRoom = useAppSelector(selectCurrentRoom);
    const { kickMember, deleteRoom, launchGame, submitAnswer } = useGameplay();
    
    const [showPlayers, setShowPlayers] = useState(false); // 🔹

    if (!currentRoom) return <></>;  

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.headerRow}>
                <h3 className={styles.title}>Room №{currentRoom.id}</h3>
                <Button
                    variant="neutral"
                    onClick={() => setShowPlayers(prev => !prev)}
                    aria-expanded={showPlayers}
                    aria-controls="players-section"
                >
                    {showPlayers ? 'Hide Players' : 'Show Players'}
                </Button>
            </div>
            {showPlayers && (
                <>
                    <div id="players-section" className={styles.playersSection}>
                        <RoomPlayerList kickMember={kickMember} />
                    </div>
                    <hr className={styles.divider} />
                </>
            )}
            <div className={styles.gameSection}>
                <div className={styles.gameContent}>
                    {(() => {
                        switch (currentRoom.state) {
                            case RoomState.CREATING:
                                return <CreatingGame startGame={launchGame} />;
                            case RoomState.STARTED:
                                return <PlayingGame onSubmitAnswer={submitAnswer} />;
                            case RoomState.ENDED:
                                return <GameFinished />;
                            default:
                                return <p>Unknown state</p>;
                        }
                    })()}
                </div>    
                {currentRoom?.leaderId === user?.id && (
                   <div className={styles.finishButtonWrapper}>
                        <Button variant="danger" onClick={deleteRoom} >
                            Finish Game
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gameplay;