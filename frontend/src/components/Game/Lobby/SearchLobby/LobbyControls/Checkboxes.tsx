import styles from '../LobbyControls.module.css';
import { LobbyOptions } from '../../../../../types/roomTypes';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { FaCheck } from 'react-icons/fa';

interface Props {
    options: LobbyOptions;
    onToggle: (field: keyof LobbyOptions) => void;
}

const Checkboxes = ({ options, onToggle }: Props) => {
    const { t } = useTranslation();

    return (
        <div className={styles.checkboxGroup}>
            <div
                className={`${styles.checkboxCard} ${options.allowAutoJoin ? styles.checkboxCardActive : ''}`}
                onClick={() => onToggle('allowAutoJoin')}
                role="checkbox"
                aria-checked={options.allowAutoJoin}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        onToggle('allowAutoJoin');
                    }
                }}
            >
                <div className={styles.checkboxBox}>
                    {options.allowAutoJoin && <FaCheck className={styles.checkIcon} />}
                </div>
                <span className={styles.checkboxLabelText}>
                    {t('lobby.allowAutoJoin')}
                </span>
            </div>

            <div
                className={`${styles.checkboxCard} ${options.publicLobby ? styles.checkboxCardActive : ''}`}
                onClick={() => onToggle('publicLobby')}
                role="checkbox"
                aria-checked={options.publicLobby}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        onToggle('publicLobby');
                    }
                }}
            >
                <div className={styles.checkboxBox}>
                    {options.publicLobby && <FaCheck className={styles.checkIcon} />}
                </div>
                <span className={styles.checkboxLabelText}>
                    {t('lobby.publicRoom')}
                </span>
            </div>
        </div>
    );
};

export default Checkboxes;
