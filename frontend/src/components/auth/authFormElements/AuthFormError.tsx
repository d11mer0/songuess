import { useEffect, useState } from 'react';
import styles from '../AuthForm.module.css';

interface AuthFormErrorProps {
    error?: { data?: { message?: string } } | string;
}

const AuthFormError: React.FC<AuthFormErrorProps> = ({ error }) => {
    const [showError, setShowError] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (error) {
            setShowError(true);
            setFadeOut(false);

            const fadeTimer = setTimeout(() => {
                setFadeOut(true);
            }, 2000);

            const hideTimer = setTimeout(() => {
                setShowError(false);
            }, 2500);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [error]);

    if (!showError) return null;

    return (
        <p className={`${styles.error} ${fadeOut ? styles['fade-out'] : ''}`}>
            {typeof error === 'string'
                ? error
                : error?.data?.message || 'Помилка'}
        </p>
    );
};

export default AuthFormError;
