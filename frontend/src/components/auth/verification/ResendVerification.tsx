import styles from './VerificationPage.module.css';
import Button from '../../../components/UI/Button/Button';

interface ResendVerificationProps {
    canResend: boolean;
    resendTimeout: number;
    onOpenModal: () => void;
}

const ResendVerification: React.FC<ResendVerificationProps> = ({
    canResend,
    resendTimeout,
    onOpenModal,
}) => {
    return canResend ? (
        <Button
            width={'200px'}
            onClick={onOpenModal}
            className={`${styles['auth-button']} ${styles['try-again']}`}
        >
            Try again
        </Button>
    ) : (
        <p className={styles['auth-message']}>
            Retry request will be available in {resendTimeout} seconds.
        </p>
    );
};

export default ResendVerification;
