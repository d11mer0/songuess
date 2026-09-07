import { useEffect, FC } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentRoom, selectGameEndedData } from '../../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../../store/hooks';
import { soundEffects } from '../../../utils/audio/soundEffects';

import styles from './GameFinished.module.css';
import Button from '../../UI/Button/Button';
import Confetti from './components/Confetti';
import FinalScores from './components/FinalScores';
import MyResults from './components/MyResults';
import { useTranslation } from '../../../i18n/LanguageContext';

type Props = {
    onRestartGame: () => void;
};

const GameFinished: FC<Props> = ({ onRestartGame }) => {
    const { t } = useTranslation();
    const gameEndedData = useSelector(selectGameEndedData);
    const currentRoom = useSelector(selectCurrentRoom);
    const { user } = useAppSelector((state) => state.user);

    useEffect(() => {
        soundEffects.playVictory();
    }, []);

    if (!gameEndedData) {
        return (
            <div className={styles.gameFinishedContainer}>
                <h2 className={styles.gameFinishedTitle}> {t('gameplay.gameOver')}</h2>
                <p className={styles.gameFinishedMessage}>
                    We couldn't retrieve your answers this time. Better luck next round!
                </p>
            </div>
        );
    }

    return (
        <div className={styles.gameFinishedContainer}>
            <Confetti />
            <h2 className={styles.gameFinishedTitle}>{t('gameplay.gameFinishedTitle')}</h2>

            <FinalScores 
                players={currentRoom?.players ?? []} 
                userId={user?.id}
            />

            <MyResults results={gameEndedData.myResults} />

            {currentRoom?.leaderId === user?.id && (
                <div className={styles.newGameButtonContainer}> 
                    <Button 
                        variant="primary" 
                        width="300px" 
                        onClick={onRestartGame}
                    >
                        {t('gameplay.startNewGame')}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default GameFinished;