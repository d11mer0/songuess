import { useState } from 'react';

import { useGameplay } from '../../hooks/Gameplay/useGameplay';
import { selectCurrentRoom } from '../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../store/hooks';
import RoomPlayerList from '../../components/Game/Lobby/JoinedLobby/RoomPlayerList';
import { FaFlagCheckered, FaDoorOpen } from 'react-icons/fa';
import GameplayHeader from '../../components/Game/Gameplay/GameplayHeader';
import GameContent from '../../components/Game/Gameplay/GameContent';

import styles from './Gameplay.module.css';
import FinishGameModal from '../../components/Game/Gameplay/FinishGameModal';
import { useTranslation } from '../../i18n/LanguageContext';

const Gameplay = () => {
    const { t } = useTranslation();
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
                    shortCode={currentRoom.shortCode}
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
                            <button
                                className={styles.finishGameBtn}
                                onClick={() => setShowFinishModal(true)}
                            >
                                <FaFlagCheckered />
                                <span>{t('gameplay.finishGame')}</span>
                            </button>
                        ) : (
                            <button
                                className={styles.finishGameBtn}
                                onClick={() => leaveRoom()}
                            >
                                <FaDoorOpen />
                                <span>{t('gameplay.leaveGame')}</span>
                            </button>
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