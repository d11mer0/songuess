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
                Check your email and confirm your account.
            </p>
        );
    }

    if (error) {
        return (
            <p className={styles['auth-error']}>
                Unsuccessfull verification:{' '}
                {(error as any).data?.message || 'Error'}
            </p>
        );
    }

    return <p className={styles['auth-success']}>Your email confirmed</p>;
};

export default VerificationStatus;
