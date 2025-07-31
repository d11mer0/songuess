import { FC } from 'react';
import { GameType } from '../../../../types/gameTypes';
import styles from '../CreatingGame.module.css';

interface GameTypeSelectorProps {
    selectedGameType: GameType;
    onChange: (type: GameType) => void;
}

const GameTypeSelection: FC<GameTypeSelectorProps> = ({
    selectedGameType,
    onChange,
}) => {
    return (
        <div className={styles.section}>
            <h2 className={styles.heading}>Select game type</h2>
            <div className={styles.gameTypeButtons}>
                <button
                    className={`${styles.typeButton} ${selectedGameType === 'ARTIST' ? styles.active : ''}`}
                    onClick={() => onChange('ARTIST')}
                >
                    Artist
                </button>
                <button
                    className={`${styles.typeButton} ${selectedGameType === 'PLAYLIST' ? styles.active : ''}`}
                    onClick={() => onChange('PLAYLIST')}
                >
                    Playlist
                </button>
                <button
                    className={`${styles.typeButton} ${selectedGameType === 'ALBUM' ? styles.active : ''}`}
                    onClick={() => onChange('ALBUM')}
                >
                    Album
                </button>
            </div>
        </div>
    );
};

export default GameTypeSelection;