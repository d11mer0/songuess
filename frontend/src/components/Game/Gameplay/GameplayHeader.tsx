import Button from '../../UI/Button/Button';
import styles from '../../../pages/Game/Gameplay.module.css';

type GameplayHeaderProps = {
    roomId: string;
    showPlayers: boolean;
    togglePlayers: () => void;
};

const GameplayHeader = ({ roomId, showPlayers, togglePlayers }: GameplayHeaderProps) => {
    return (
        <div className={styles.headerRow}>
            <h3 className={styles.title}>Room №{roomId}</h3>
            <Button
                variant="neutral"
                onClick={togglePlayers}
                aria-expanded={showPlayers}
                aria-controls="players-section"
            >
                {showPlayers ? 'Hide Players' : 'Show Players'}
            </Button>
        </div>
    );
};

export default GameplayHeader;