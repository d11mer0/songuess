import React from 'react';
import { Link } from 'react-router-dom';
import styles from './VerificationPage.module.css';

interface VerificationStatusProps {
    token: string | null;
    error: any;
    isSuccess?: boolean;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({
    token,
    error,
}) => {
    if (!token) {
        return (
            <div className={styles.statusBox}>
                <div className={styles.iconInfo}>✉️</div>
                <h3 className={styles.title}>Confirm Your Email</h3>
                <p className={styles.message}>
                    Check your inbox and confirm your account using the verification link sent to your email.
                </p>
            </div>
        );
    }

    if (error) {
        const errorMsg =
            typeof error === 'object' && error?.data?.message
                ? error.data.message
                : 'Email verification failed or token has expired.';

        return (
            <div className={styles.statusBox}>
                <div className={styles.iconError}>⚠️</div>
                <h3 className={styles.title}>Verification Failed</h3>
                <p className={styles.errorMessage}>{errorMsg}</p>
            </div>
        );
    }

    return (
        <div className={styles.statusBox}>
            <div className={styles.iconSuccess}>✓</div>
            <h3 className={styles.title}>Email Verified!</h3>
            <p className={styles.successMessage}>
                Your email address has been successfully confirmed. You can now access your account.
            </p>
            <Link to="/auth/login" className={styles.loginLink}>
                Proceed to Login
            </Link>
        </div>
    );
};

export default VerificationStatus;
