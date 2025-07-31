import { FC } from 'react';
import { RoomState } from '../../../types/roomTypes';
import { SelectedTracks } from '../../../types/gameTypes';
import CreatingGame from '../Creating/CreatingGame';
import PlayingGame from '../Play/PlayingGame';
import GameFinished from '../GameFinished/GameFinished';
import styles from '../../../pages/Game/Gameplay.module.css';

type Props = {
    state: RoomState;
    onStart: (selectedTracks: SelectedTracks) => void;
    onSubmitAnswer: (answer: string) => void;
};

const GameContent: FC<Props> = ({ state, onStart, onSubmitAnswer }) => {
  return (
        <div className={styles.gameContent}>
            {(() => {
                switch (state) {
                    case RoomState.CREATING:
                        return <CreatingGame startGame={onStart} />;
                    case RoomState.STARTED:
                        return <PlayingGame onSubmitAnswer={onSubmitAnswer} />;
                    case RoomState.ENDED:
                        return <GameFinished />;
                    default:
                        return <p>Unknown state</p>;
                }
            })()}
        </div>
  );
};

export default GameContent;