import styles from '../LobbyControls.module.css';

interface Props {
    maxPlayers: number;
    onChange: (value: number) => void;
}

const MaxPlayersInput = ({ maxPlayers, onChange }: Props) => {
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
                Maximum number of players
            </label>
            <div className={styles.counterWrapper}>
                <button
                    type="button"
                    className={styles.counterButton}
                    onClick={() => onChange(Math.max(3, maxPlayers - 1))}
                >
                    –
                </button>
                <input
                    id="maxPlayers"
                    type="text"
                    inputMode="numeric"
                    value={maxPlayers}
                    onChange={handleInput}
                    className={styles.counterInput}
                />
                <button
                    type="button"
                    className={styles.counterButton}
                    onClick={() => onChange(Math.min(9, maxPlayers + 1))}
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default MaxPlayersInput;