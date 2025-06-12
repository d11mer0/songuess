import { useState } from 'react';
import { LobbyOptions } from '../../../../types/roomTypes';
import styles from './LobbyControls.module.css';
import Checkboxes from './LobbyControls/Checkboxes';
import MaxPlayersInput from './LobbyControls/MaxPlayersInput';
import ActionButtons from './LobbyControls/ActionButtons';

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

    const handleChange = (field: keyof LobbyOptions) =>
        setLobbyOptions(prev => ({ ...prev, [field]: !prev[field] }));

    const setMaxPlayers = (value: number) =>
        setLobbyOptions(prev => ({ ...prev, maxPlayers: value }));

    return (
        <div className={styles.controlsContainer}>
            <h3 className={styles.sectionTitle}>Creating new room</h3>
            <Checkboxes options={lobbyOptions} onToggle={handleChange} />
            <MaxPlayersInput maxPlayers={lobbyOptions.maxPlayers} onChange={setMaxPlayers} />
            <ActionButtons
                onAutoJoin={autoJoinRoom}
                onCreateRoom={createRoom}
                options={lobbyOptions}
            />
        </div>
    );
};

export default LobbyControls;