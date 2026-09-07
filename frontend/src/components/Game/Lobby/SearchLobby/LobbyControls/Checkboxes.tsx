import styles from '../LobbyControls.module.css';
import { LobbyOptions } from '../../../../../types/roomTypes';
import { useTranslation } from '../../../../../i18n/LanguageContext';

interface Props {
    options: LobbyOptions;
    onToggle: (field: keyof LobbyOptions) => void;
}

const Checkboxes = ({ options, onToggle }: Props) => {
    const { t } = useTranslation();

    return (
        <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    className="checkbox"
                    checked={options.allowAutoJoin}
                    onChange={() => onToggle('allowAutoJoin')}
                />
                {t('lobby.allowAutoJoin')}
            </label>
            <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    className="checkbox"
                    checked={options.publicLobby}
                    onChange={() => onToggle('publicLobby')}
                />
                {t('lobby.publicRoom')}
            </label>
        </div>
    );
};

export default Checkboxes;
