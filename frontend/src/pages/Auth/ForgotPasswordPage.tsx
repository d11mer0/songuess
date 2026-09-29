import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
                <div className={styles.messageCard}>
                    <div className={styles.messageIcon}>✉️</div>
                    <h3 className={styles.messageTitle}>Check your inbox</h3>
                    <p className={styles['auth-message']}>
                        An email with instructions on how to reset your password has 
                        been sent to your inbox. Please check your inbox or spam folder.
                    </p>
                    <Link to="/auth/login" className={styles.returnLink}>
                        Back to Login
                    </Link>
                </div>
            ) : (
                <AuthFormWrapper
                    title="Password Recovery"
                    onSubmit={handleSubmit}
                    inputs={['email']}
                    formData={formData}
                    handleChange={handleChange}
                    submitButtonText="Send Reset Link"
                    error={error as any}
                    isLoading={isLoading}
                    links={[{ to: '/auth/login', label: 'Remember password? Log in' }]}
                />
            )}
        </div>
    );
};

export default ForgotPassword;
