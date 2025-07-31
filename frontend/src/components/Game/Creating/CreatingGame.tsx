import { FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../../store/store';
import { GameType, SelectedTracks } from '../../../types/gameTypes';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentRoom } from '../../../store/gameplay/gameplaySelectors';

import LeaderWaitingView from './CreatingGame/LeaderWaitingView';
import GameTypeSelection from './CreatingGame/GameTypeSelection';
import TrackSelectionBlock from './CreatingGame/TrackSelectionBlock';

import styles from './CreatingGame.module.css';

interface CreatingGameProps {
    startGame: (tracks: SelectedTracks) => void;
}

const CreatingGame: FC<CreatingGameProps> = ({ startGame }) => {
    const { user } = useSelector((state: RootState) => state.user);
    const currentRoom = useAppSelector(selectCurrentRoom);
    
    const [selectedGameType, setSelectedGameType] =
        useState<GameType>('ARTIST');
    
    if (!currentRoom) return null;

    return ( 
        <div className={styles.container}>
            {user?.id !== currentRoom.leaderId ? (
                <LeaderWaitingView />
            ) : (
                <>
                    <GameTypeSelection
                        selectedGameType={selectedGameType}
                        onChange={setSelectedGameType}
                    />

                    <div className={styles.selectionSection}>
                        <TrackSelectionBlock
                            selectedGameType={selectedGameType}
                            onStart={startGame}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default CreatingGame;
