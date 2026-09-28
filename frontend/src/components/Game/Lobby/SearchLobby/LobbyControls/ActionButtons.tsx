import styles from '../LobbyControls.module.css';
import { LobbyOptions } from '../../../../../types/roomTypes';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { FaDoorOpen, FaPlusCircle } from 'react-icons/fa';

interface Props {
    onAutoJoin: () => void;
    onCreateRoom: (options: LobbyOptions) => void;
    options: LobbyOptions;
}

const ActionButtons = ({ onAutoJoin, onCreateRoom, options }: Props) => {
    const { t } = useTranslation();

    return (
        <div className={styles.buttonGroup}>
            <button
                type="button"
                className={styles.autoJoinBtn}
                onClick={onAutoJoin}
            >
                <FaDoorOpen className={styles.actionBtnIcon} />
                <span>{t('lobby.autoJoinBtn')}</span>
            </button>
            <button
                type="button"
                className={styles.createRoomMainBtn}
                onClick={() => onCreateRoom(options)}
            >
                <FaPlusCircle className={styles.actionBtnIcon} />
                <span>{t('lobby.createRoomBtn')}</span>
            </button>
        </div>
    );
};

export default ActionButtons;