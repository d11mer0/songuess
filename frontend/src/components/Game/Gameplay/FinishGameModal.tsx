import CustomModal from '../../UI/Modal/Modal';
import Button from '../../UI/Button/Button';
import styles from '../../../pages/Game/Gameplay.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const FinishGameModal = ({ isOpen, onClose, onConfirm }: Props) => (
    <CustomModal title="Confirm Finish" isOpen={isOpen} onClose={onClose}>
        <p className={styles.modalText}>
            Are you sure you want to finish the game for all players?
        </p>
        <div className={styles.modalButtons}>
            <Button variant="neutral" onClick={onClose}>
                Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm}>
                Confirm
            </Button>
        </div>
    </CustomModal>
);

export default FinishGameModal;
