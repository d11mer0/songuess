import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVerifyEmailMutation } from '../../store/api/authApi';

import styles from './AuthPages.module.css';
import Loader from '../../components/UI/Loader/Loader';
import VerificationStatus from '../../components/auth/verification/VerificationStatus';
import ResendVerification from '../../components/auth/verification/ResendVerification';
import ResendModal from '../../components/auth/verification/ResendModal';

const VERIFY_TIMEOUT = 180; // 3 хвилини

const VerifyPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [verifyEmail, { isLoading, error }] = useVerifyEmailMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [resendTimeout, setResendTimeout] = useState(VERIFY_TIMEOUT);

    useEffect(() => {
        if (token) {
            verifyEmail(token);
        }
    }, [token, verifyEmail]);

    useEffect(() => {
        if (resendTimeout > 0) {
            const timer = setTimeout(
                () => setResendTimeout((prev) => prev - 1),
                1000,
            );
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimeout]);

    if (!isModalOpen && isLoading) {
        return <Loader />;
    }

    return (
        <div className={styles['auth-container']}>
            <VerificationStatus token={token} error={error} />
            <ResendVerification
                canResend={canResend}
                resendTimeout={resendTimeout}
                onOpenModal={() => setIsModalOpen(true)}
            />
            <ResendModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default VerifyPage;
