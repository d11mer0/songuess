import Button from '../../../../UI/Button/Button';
import styles from '../LobbyControls.module.css';
import { LobbyOptions } from '../../../../../types/roomTypes';

interface Props {
    onAutoJoin: () => void;
    onCreateRoom: (options: LobbyOptions) => void;
    options: LobbyOptions;
}

const ActionButtons = ({ onAutoJoin, onCreateRoom, options }: Props) => (
    <div className={styles.buttonGroup}>
        <Button variant="neutral" width="75%" onClick={onAutoJoin}>
            Auto join to free room
        </Button>
        <Button variant="primary" width="90%" onClick={() => onCreateRoom(options)}>
            Create Room
        </Button>
    </div>
);

export default ActionButtons;