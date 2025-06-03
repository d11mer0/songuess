import styles from './VerificationPage.module.css';

interface VerificationStatusProps {
    token: string | null;
    error: any;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({
    token,
    error,
}) => {
    if (!token) {
        return (
            <p className={styles['auth-message']}>
                Перевірте пошту та підтвердіть ваш акаунт.
            </p>
        );
    }

    if (error) {
        return (
            <p className={styles['auth-error']}>
                Верифікація не вдалася:{' '}
                {(error as any).data?.message || 'Помилка'}
            </p>
        );
    }

    return <p className={styles['auth-success']}>Ваш email підтверджено!</p>;
};

export default VerificationStatus;
