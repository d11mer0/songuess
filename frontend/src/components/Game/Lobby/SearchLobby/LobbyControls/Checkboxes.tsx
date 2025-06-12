import styles from '../LobbyControls.module.css';
import { LobbyOptions } from '../../../../../types/roomTypes';

interface Props {
    options: LobbyOptions;
    onToggle: (field: keyof LobbyOptions) => void;
}

const Checkboxes = ({ options, onToggle }: Props) => (
    <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
            <input
                type="checkbox"
                className="checkbox"
                checked={options.allowAutoJoin}
                onChange={() => onToggle('allowAutoJoin')}
            />
            Allow auto join
        </label>
        <label className={styles.checkboxLabel}>
            <input
                type="checkbox"
                className="checkbox"
                checked={options.publicLobby}
                onChange={() => onToggle('publicLobby')}
            />
            Public room
        </label>
    </div>
);

export default Checkboxes;
