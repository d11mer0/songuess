import AnswerOptions from './PlayingGame/AnswerOptions';
import AudioPlayer from './PlayingGame/AudioPlayer';
import RoundResult from './PlayingGame/RoundResult';
import { useAppSelector } from '../../../store/hooks';
import { selectTrackInfo, selectCurrentRoom } from '../../../store/gameplay/gameplaySelectors';
import Loader from '../../UI/Loader/Loader/Loader';

import styles from './PlayingGame.module.css';
import TotalScore from './PlayingGame/TotalScore';
import PlayersRoundResults from './PlayingGame/PlayersRoundResults';

type PlayingGameProps = {
    onSubmitAnswer: (option: string) => void;
};

const PlayingGame = ({ onSubmitAnswer }: PlayingGameProps) => {
    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);

    if (!currentRoom) return null;

    return (
        <div className={styles.layout}>
             <div className={styles.leftCol}>
                <TotalScore />
            </div>
            <div className={styles.centerCol}>
                <div className={styles.playingWrapper}>
                    {trackInfo ? (
                        <>
                            <h1 className={styles.roundTitle}>Round №{trackInfo.roundNumber + 1}</h1>
                            
                            <div className={styles.section}>
                                
                                <AnswerOptions onSubmit={onSubmitAnswer} />
                                <RoundResult />
                                <PlayersRoundResults />
                                <div className={styles.audioControl}>
                                    <AudioPlayer />
                                </div>
                            </div>
                        </>
                    ) : (
                        <Loader text="Next round is loading..." />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayingGame;
