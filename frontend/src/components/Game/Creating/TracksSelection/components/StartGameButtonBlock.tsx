import Button from '../../../../UI/Button/Button';
import styles from '../TrackSelection.module.css';

const MIN_TRACKS = 10;

interface Props {
    trackCount: number;
    onClick: () => void;
}

const StartGameButtonBlock: React.FC<Props> = ({
    trackCount,
    onClick,
}) => {
    const isDisabled = trackCount < MIN_TRACKS;

    return (
        <div className={styles.sendButtonWrapper}>
            <Button
                variant="primary"
                width="250px"
                onClick={onClick}
                disabled={isDisabled}
            >
                Start game
            </Button>

            {isDisabled && (
                <p className={styles.warningText}>
                    To start the game, select an album with <strong>at least {MIN_TRACKS} tracks.</strong>.
                </p>
            )}
        </div>
    );
};

export default StartGameButtonBlock;