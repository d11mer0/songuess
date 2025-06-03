import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../store/api/authApi';
import useForm from '../../hooks/useForm';

import AuthFormWrapper from '../../components/auth/AuthFormWrapper';

import styles from './AuthPages.module.css';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [registerUser, { isLoading, error }] = useRegisterMutation();
    const { formData, handleChange } = useForm<{
        login: string;
        email: string;
        password: string;
    }>({
        login: '',
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await registerUser(formData).unwrap();
            navigate('/auth/verify');
        } catch {}
    };

    return (
        <div className={styles['auth-container']}>
            <AuthFormWrapper
                title="Реєстрація"
                onSubmit={handleSubmit}
                inputs={['login', 'email', 'password']}
                formData={formData}
                handleChange={handleChange}
                error={error as any}
                submitButtonText="Зареєструватися"
                isLoading={isLoading}
                links={[{ to: '/auth/login', label: 'Log in' }]}
            />
        </div>
    );
};

export default RegisterPage;
