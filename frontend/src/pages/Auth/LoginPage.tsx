import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../store/api/authApi';
import useForm from '../../hooks/useForm';
import AuthFormWrapper from '../../components/auth/AuthFormWrapper';
import GoogleLoginButton from '../../components/GoogleLoginButton/GoogleLoginButton';

import styles from './AuthPages.module.css';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [loginUser, { isLoading, error }] = useLoginMutation();
    const { formData, handleChange } = useForm<{
        email: string;
        password: string;
    }>({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await loginUser(formData).unwrap();
            navigate('/');
        } catch {}
    };

    return (
        <div className={styles['auth-container']}>
            <AuthFormWrapper
                title="Login"
                onSubmit={handleSubmit}
                inputs={['login', 'password']}
                formData={formData}
                handleChange={handleChange}
                error={error as any}
                submitButtonText="Sign in"
                isLoading={isLoading}
                links={[
                    { to: '/auth/register', label: 'Sign up' },
                    { to: '/auth/forgot-password', label: 'Forgot password?' },
                    {
                        to: '/auth/verify',
                        label: 'Created account but need to verify?',
                    },
                ]}
            >
                <div className={styles.googleButton}>
                    <GoogleLoginButton />
                </div>
            </AuthFormWrapper>
        </div>
    );
};

export default LoginPage;
