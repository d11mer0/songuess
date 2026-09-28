import styles from '../LobbyControls.module.css';
import { useTranslation } from '../../../../../i18n/LanguageContext';
import { FaUsers, FaMinus, FaPlus } from 'react-icons/fa';

interface Props {
    maxPlayers: number;
    onChange: (value: number) => void;
}

const MaxPlayersInput = ({ maxPlayers, onChange }: Props) => {
    const { t } = useTranslation();

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[3-9]$/.test(val)) return onChange(Number(val));
        if (val === '') return onChange(3);
        const last = val.slice(-1);
        if (/^[3-9]$/.test(last)) return onChange(Number(last));
    };

    return (
        <div className={styles.playerCountContainer}>
            <label htmlFor="maxPlayers" className={styles.inputLabel}>
                {t('lobby.maxPlayers')}
            </label>
            <div className={styles.stepperContainer}>
                <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => onChange(Math.max(3, maxPlayers - 1))}
                    disabled={maxPlayers <= 3}
                    title="Зменшити"
                >
                    <FaMinus />
                </button>
                <div className={styles.stepperDisplay}>
                    <FaUsers className={styles.stepperIcon} />
                    <input
                        id="maxPlayers"
                        type="text"
                        inputMode="numeric"
                        value={maxPlayers}
                        onChange={handleInput}
                        className={styles.counterInput}
                    />
                </div>
                <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => onChange(Math.min(9, maxPlayers + 1))}
                    disabled={maxPlayers >= 9}
                    title="Збільшити"
                >
                    <FaPlus />
                </button>
            </div>
        </div>
    );
};

export default MaxPlayersInput;