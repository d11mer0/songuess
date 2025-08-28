import { useSelector } from 'react-redux';
import { selectCurrentRoom, selectGameEndedData } from '../../../store/gameplay/gameplaySelectors';
import { useAppSelector } from '../../../store/hooks';

import styles from './GameFinished.module.css';
import Button from '../../UI/Button/Button';
import Confetti from './components/Confetti';
import FinalScores from './components/FinalScores';
import MyResults from './components/MyResults';
import { FC } from 'react';

type Props = {
    onRestartGame: ()=> void;
};

const GameFinished: FC<Props> = ({ onRestartGame }) => {
    const gameEndedData = useSelector(selectGameEndedData);
    const currentRoom = useSelector(selectCurrentRoom);
    const { user } = useAppSelector((state) => state.user);


    if (!gameEndedData) {
        return (
            <div className={styles.gameFinishedContainer}>
                <h2 className={styles.gameFinishedTitle}> Game Over</h2>
                <p className={styles.gameFinishedMessage}>
                    We couldn't retrieve your answers this time. Better luck next round!
                </p>
            </div>
        );
    }

    return (
        <div className={styles.gameFinishedContainer}>
            <Confetti />
            <h2 className={styles.gameFinishedTitle}>Game Finished</h2>

            <FinalScores 
                players={currentRoom?.players ?? []} 
                userId={user?.id}
            />

            <MyResults results={gameEndedData.myResults} />

            {currentRoom?.leaderId === user?.id ?
                <div className={styles.newGameButtonContainer}> 
                    <Button 
                        variant='primary' 
                        width='300px' 
                        onClick={onRestartGame}
                    >
                        Start new game
                    </Button>
                </div> : <></> 
            }
        </div>
    );
};

export default GameFinished;
