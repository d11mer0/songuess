import CustomModal from '../../UI/Modal/Modal';
import Button from '../../UI/Button/Button';
import styles from '../../../pages/Game/Gameplay.module.css';
import { useTranslation } from '../../../i18n/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const FinishGameModal = ({ isOpen, onClose, onConfirm }: Props) => {
    const { t } = useTranslation();

    return (
        <CustomModal title={t('gameplay.confirmFinish')} isOpen={isOpen} onClose={onClose}>
            <p className={styles.modalText}>
                {t('gameplay.confirmFinishText')}
            </p>
            <div className={styles.modalButtons}>
                <Button variant="neutral" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button variant="danger" onClick={onConfirm}>
                    {t('gameplay.finishGame')}
                </Button>
            </div>
        </CustomModal>
    );
};

export default FinishGameModal;
