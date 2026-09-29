import { useState, FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useResetPasswordMutation } from '../../store/api/authApi';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import useForm from '../../hooks/useForm';

import styles from './AuthPages.module.css';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { formData, handleChange } = useForm({ password: '' });
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) {
            console.error('Token is missing!');
            return;
        }

        try {
            await resetPassword({
                token,
                newPassword: formData.password,
            }).unwrap();
            setPasswordChanged(true);
            setTimeout(() => navigate('/auth/login'), 2200);
        } catch {}
    };

    return (
        <div className={styles['auth-container']}>
            {!token ? (
                <div className={styles.messageCard}>
                    <div className={styles.messageIconError}>⚠️</div>
                    <h3 className={styles.messageTitle}>Invalid Link</h3>
                    <p className={styles['auth-message']}>
                        This password reset link is invalid or has expired.
                    </p>
                    <Link to="/auth/forgot-password" className={styles.returnLink}>
                        Request a new link
                    </Link>
                </div>
            ) : passwordChanged ? (
                <div className={styles.messageCard}>
                    <div className={styles.messageIconSuccess}>✓</div>
                    <h3 className={styles.messageTitle}>Password Changed!</h3>
                    <p className={styles['auth-message']}>
                        Your password has been successfully updated. Redirecting to login...
                    </p>
                </div>
            ) : (
                <AuthFormWrapper
                    title="Set New Password"
                    onSubmit={handleSubmit}
                    inputs={['password']}
                    formData={formData}
                    handleChange={handleChange}
                    error={error as any}
                    submitButtonText="Update Password"
                    isLoading={isLoading}
                    links={[{ to: '/auth/login', label: 'Back to Log in' }]}
                />
            )}
        </div>
    );
};

export default ResetPassword;
