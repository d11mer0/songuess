import { useState, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useResetPasswordMutation } from '../../store/api/authApi';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import useForm from '../../hooks/useForm';

import styles from './AuthPages.module.css';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Отримуємо токен з URL
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
            setTimeout(() => navigate('/auth/login'), 2000);
        } catch {}
    };

    return (
        <div className={styles['auth-container']}>
            {!token ? (
                <p className={styles['auth-message']}>
                    Invalid password reset link
                </p>
            ) : passwordChanged ? (
                <p className={styles['auth-message']}>
                    Password changed successfully! You will be redirected...
                </p>
            ) : (
                <AuthFormWrapper
                    title="New password setting"
                    onSubmit={handleSubmit}
                    inputs={['password']}
                    formData={formData}
                    handleChange={handleChange}
                    error={error as any}
                    submitButtonText="Change password"
                    isLoading={isLoading}
                    links={[{ to: '/auth/login', label: 'Log in' }]}
                />
            )}
        </div>
    );
};

export default ResetPassword;
