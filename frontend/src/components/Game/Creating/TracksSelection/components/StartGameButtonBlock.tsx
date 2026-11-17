import Button from '../../../../UI/Button/Button';
import styles from '../TrackSelection.module.css';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { useTrackSelectionMode } from '../TrackSelectionModeContext';

const MIN_TRACKS_SINGLE = 4;
const MIN_TRACKS_MIX_SOURCE = 1;

interface Props {
    trackCount: number;
    onClick: () => void;
}

const StartGameButtonBlock: React.FC<Props> = ({
    trackCount,
    onClick,
}) => {
    const { t } = useTranslation();
    const { isMixMode } = useTrackSelectionMode();

    const minTracks = isMixMode ? MIN_TRACKS_MIX_SOURCE : MIN_TRACKS_SINGLE;
    const isDisabled = trackCount < minTracks;

    return (
        <div className={styles.sendButtonWrapper}>
            <Button
                variant={isMixMode ? 'secondary' : 'primary'}
                width={isMixMode ? '290px' : '250px'}
                onClick={onClick}
                disabled={isDisabled}
            >
                {isMixMode
                    ? `+ ${t('gameCreation.mixAddBtn', { count: trackCount })}`
                    : t('gameCreation.startGame')}
            </Button>

            {isDisabled && (
                <p className={styles.warningText}>
                    {isMixMode
                        ? t('gameCreation.mixMinSourceWarning')
                        : t('gameCreation.minTracksWarning', { min: MIN_TRACKS_SINGLE })}
                </p>
            )}
        </div>
    );
};

export default StartGameButtonBlock;
