import { useState } from 'react';
import { LobbyOptions } from '../../../../types/roomTypes';
import styles from '../GameLobby.module.css';

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

    const handleMaxPlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (value >= 3 && value <= 9) {
            setLobbyOptions((prev) => ({ ...prev, maxPlayers: value }));
        }
    };

    const handleCheckboxChange = (field: keyof LobbyOptions) => {
        setLobbyOptions((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div>
            <button
                onClick={() => createRoom(lobbyOptions)}
                className={styles.button}
            >
                Створити кімнату
            </button>
            <label className={styles.label}>
                <input
                    type="checkbox"
                    checked={lobbyOptions.allowAutoJoin}
                    onChange={() => handleCheckboxChange('allowAutoJoin')}
                />
                Дозволити авто-приєднання
            </label>
            <label className={styles.label}>
                <input
                    type="checkbox"
                    checked={lobbyOptions.publicLobby}
                    onChange={() => handleCheckboxChange('publicLobby')}
                />
                Публічна кімната
            </label>
            <label className={styles.label}>
                Макс. гравців:
                <input
                    type="number"
                    value={lobbyOptions.maxPlayers}
                    onChange={handleMaxPlayersChange}
                    min={3}
                    max={9}
                    className={styles.input}
                />
            </label>
            <button onClick={autoJoinRoom} className={styles.button}>
                Авто-приєднання
            </button>
        </div>
    );
};

export default LobbyControls;
