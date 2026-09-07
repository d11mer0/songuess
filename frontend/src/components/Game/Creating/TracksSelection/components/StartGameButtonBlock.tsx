import Button from '../../../../UI/Button/Button';
import styles from '../TrackSelection.module.css';
import { useTranslation } from '../../../../../i18n/LanguageContext';

const MIN_TRACKS = 10;

interface Props {
    trackCount: number;
    onClick: () => void;
}

const StartGameButtonBlock: React.FC<Props> = ({
    trackCount,
    onClick,
}) => {
    const { t } = useTranslation();
    const isDisabled = trackCount < MIN_TRACKS;

    return (
        <div className={styles.sendButtonWrapper}>
            <Button
                variant="primary"
                width="250px"
                onClick={onClick}
                disabled={isDisabled}
            >
                {t('gameCreation.startGame')}
            </Button>

            {isDisabled && (
                <p className={styles.warningText}>
                    {t('gameCreation.minTracksWarning', { min: MIN_TRACKS })}
                </p>
            )}
        </div>
    );
};

export default StartGameButtonBlock;