import React from 'react';
import styles from './VerificationPage.module.css';

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
    return (
        <div className={styles.resendSection}>
            <div className={styles.resendDivider}>
                <span className={styles.resendDividerLine} />
                <span className={styles.resendDividerText}>Didn't receive email?</span>
                <span className={styles.resendDividerLine} />
            </div>

            {canResend ? (
                <button
                    type="button"
                    onClick={onOpenModal}
                    className={styles.resendButton}
                >
                    Resend Verification Email
                </button>
            ) : (
                <div className={styles.cooldownBadge}>
                    <span className={styles.cooldownIcon}>⏳</span>
                    <span>
                        Resend available in{' '}
                        <strong className={styles.cooldownTime}>{resendTimeout}s</strong>
                    </span>
                </div>
            )}
        </div>
    );
};

export default ResendVerification;
