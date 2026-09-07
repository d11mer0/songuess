import Button from '../../../../UI/Button/Button';
import styles from '../LobbyControls.module.css';
import { LobbyOptions } from '../../../../../types/roomTypes';
import { useTranslation } from '../../../../../i18n/LanguageContext';

interface Props {
    onAutoJoin: () => void;
    onCreateRoom: (options: LobbyOptions) => void;
    options: LobbyOptions;
}

const ActionButtons = ({ onAutoJoin, onCreateRoom, options }: Props) => {
    const { t } = useTranslation();

    return (
        <div className={styles.buttonGroup}>
            <Button variant="neutral" width="75%" onClick={onAutoJoin}>
                {t('lobby.autoJoinBtn')}
            </Button>
            <Button variant="primary" width="90%" onClick={() => onCreateRoom(options)}>
                {t('lobby.createRoomBtn')}
            </Button>
        </div>
    );
};

export default ActionButtons;