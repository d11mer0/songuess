import { useState } from 'react';
import { LobbyOptions } from '../../../../types/roomTypes';
import styles from '../GameLobby.module.css';
import Button from '../../../UI/Button/Button';

interface Props {
    createRoom: (options: LobbyOptions) => void;
    autoJoinRoom: () => void;
}

const LobbyControls = ({ createRoom, autoJoinRoom }: Props) => {
    const [lobbyOptions, setLobbyOptions] = useState<LobbyOptions>({
        allowAutoJoin: true,
        publicLobby: true,
        maxPlayers: 3,
    });

    const handleMaxPlayersInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[3-9]$/.test(val)) {
            const num = Number(val);
            setLobbyOptions(prev => ({ ...prev, maxPlayers: num }));
            return;
        }
        if (val === '') {
            setLobbyOptions(prev => ({ ...prev, maxPlayers: 3 }));
        }
        if (val.length > 1) {
            const lastChar = val.slice(-1);
            if (/^[3-9]$/.test(lastChar)) {
                const num = Number(lastChar);
                setLobbyOptions(prev => ({ ...prev, maxPlayers: num }));
            }
        }
    };

    const updateMaxPlayers = (change: number) => {
        setLobbyOptions(prev => {
            const newValue = Math.min(9, Math.max(3, prev.maxPlayers + change));
            return { ...prev, maxPlayers: newValue };
        });
    };


    const handleCheckboxChange = (field: keyof LobbyOptions) => {
        setLobbyOptions((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className={styles.controlsContainer}>
            <h3 className={styles.sectionTitle}>Creating new room</h3>

            <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        className="checkbox" // глобальний клас
                        checked={lobbyOptions.allowAutoJoin}
                        onChange={() => handleCheckboxChange('allowAutoJoin')}
                    />
                    Allow auto join
                </label>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        className="checkbox" // глобальний клас
                        checked={lobbyOptions.publicLobby}
                        onChange={() => handleCheckboxChange('publicLobby')}
                    />
                    Public room
                </label>
            </div>

            <div className={styles.playerCountContainer}>
                <label htmlFor="maxPlayers" className={styles.inputLabel}>
                    Maximum number of players
                </label>
                <div className={styles.counterWrapper}>
                    <button
                        type="button"
                        className={styles.counterButton}
                        onClick={() => updateMaxPlayers(-1)}
                    >
                        –
                    </button>
                    <input
                        id="maxPlayers"
                        type="text"
                        inputMode="numeric"
                        value={lobbyOptions.maxPlayers}
                        onChange={handleMaxPlayersInput}
                        className={styles.counterInput}
                    />
                    <button
                        type="button"
                        className={styles.counterButton}
                        onClick={() => updateMaxPlayers(1)}
                    >
                        +
                    </button>
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <Button
                    variant="neutral"
                    width="75%"
                    onClick={autoJoinRoom}
                >
                    Auto join to free room
                </Button>
                <Button
                    variant="primary"
                    width="90%"
                    onClick={() => createRoom(lobbyOptions)}
                >
                    Create Room
                </Button>
            </div>
        </div>
    );
};

export default LobbyControls;
