import { useState, FormEvent } from 'react';
import { useSendTokenMutation } from '../../store/api/authApi';
import useForm from '../../hooks/useForm';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';

import styles from './AuthPages.module.css';

import { TOKEN_TYPE_PASSWORD_RESET } from '../../constants/constants';

const ForgotPassword: React.FC = () => {
    const { formData, handleChange } = useForm({ email: '' });
    const [emailSent, setEmailSent] = useState(false);
    const [sendToken, { isLoading, error }] = useSendTokenMutation();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await sendToken({
                email: formData.email,
                type: TOKEN_TYPE_PASSWORD_RESET,
            }).unwrap();
            setEmailSent(true);
        } catch {}
    };

    return (
        <div className={styles['auth-container']}>
            {emailSent ? (
                <p className={styles['auth-message']}>
                    An email with instructions on how to reset your password has 
                    been sent to your inbox. Please check your inbox or spam folder.
                </p>
            ) : (
                <AuthFormWrapper
                    title="Password recovery"
                    onSubmit={handleSubmit}
                    inputs={['email']}
                    formData={formData}
                    handleChange={handleChange}
                    submitButtonText="Send"
                    error={error as any}
                    isLoading={isLoading}
                    links={[{ to: '/auth/login', label: 'Log in' }]}
                />
            )}
        </div>
    );
};

export default ForgotPassword;
