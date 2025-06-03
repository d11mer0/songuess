import AnswerOptions from './PlayingGame/AnswerOptions';
import AudioPlayer from './PlayingGame/AudioPlayer';
import RoundResult from './PlayingGame/RoundResult';
import { useAppSelector } from '../../../store/hooks';
import { selectTrackInfo, selectCurrentRoom } from '../../../store/gameplay/gameplaySelectors';

type PlayingGameProps = {
    onSubmitAnswer: (option: string) => void;
};

const PlayingGame = ({ onSubmitAnswer }: PlayingGameProps) => {
    const currentRoom = useAppSelector(selectCurrentRoom);
    const trackInfo = useAppSelector(selectTrackInfo);

    if (!currentRoom) return <div>Some troubles with currentRoom</div>;
        
    return (
        <div>
            <h3>ПОТОЧНА ГРА!</h3>
            <p>Тип гри: {currentRoom.leaderId ?? 'не вибрано'}</p>
            {trackInfo ? (
                <div>
                    <p>Раунд номер: {trackInfo.roundNumber + 1}</p>
                    <AnswerOptions onSubmit={onSubmitAnswer} />
                    <AudioPlayer />
                    <RoundResult />
                </div>
            ) : null}
        </div>
    );
};

export default PlayingGame;
