import { useState } from 'react';

import { useGameplay } from '../../hooks/Gameplay/useGameplay';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../store/hooks';
import RoomPlayerList from '../../components/Game/Lobby/JoinedLobby/RoomPlayerList';
import Button from '../../components/UI/Button/Button';
import CustomModal from '../../components/UI/Modal/Modal';
import GameplayHeader from '../../components/Game/Gameplay/GameplayHeader';
import GameContent from '../../components/Game/Gameplay/GameContent';

import styles from './Gameplay.module.css';
import FinishGameModal from '../../components/Game/Gameplay/FinishGameModal';

const Gameplay = () => {
    const { user } = useAppSelector((state) => state.user);
    const currentRoom = useAppSelector(selectCurrentRoom);
    const { kickMember, deleteRoom, launchGame, submitAnswer, leaveRoom, restartGame } = useGameplay();
    
    const [showPlayers, setShowPlayers] = useState(false); // 🔹
    const [showFinishModal, setShowFinishModal] = useState(false);

    if (!currentRoom) return <></>

    return (
        <>
            <div className={styles.pageWrapper}>
                <GameplayHeader
                    roomId={currentRoom.id}
                    showPlayers={showPlayers}
                    togglePlayers={() => setShowPlayers(prev => !prev)}
                />
                {showPlayers && (
                    <>
                        <div id="players-section" className={styles.playersSection}>
                            <RoomPlayerList kickMember={kickMember} />
                        </div>
                        <hr className={styles.divider} />
                    </>
                )}
                <div className={styles.gameSection}>
                    <GameContent
                        state={currentRoom.state}
                        onStart={launchGame}
                        onSubmitAnswer={submitAnswer}
                        onRestartGame={restartGame}
                    />
                    <div className={styles.finishButtonWrapper}>
                        {currentRoom?.leaderId === user?.id ? (
                            <Button width="300px" variant="danger" onClick={() => setShowFinishModal(true)}>
                                Finish Game
                            </Button>
                        ) : (
                            <Button width="300px" variant="danger" onClick={() => leaveRoom()}>
                                Leave Game
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <FinishGameModal
                isOpen={showFinishModal}
                onClose={() => setShowFinishModal(false)}
                onConfirm={deleteRoom}
            />
        </>
    );
};

export default Gameplay;