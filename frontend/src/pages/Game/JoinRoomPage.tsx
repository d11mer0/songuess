import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useTranslation } from '../../i18n/LanguageContext';
import Button from '../../components/UI/Button/Button';
import Loader from '../../components/UI/Loader/Loader/Loader';
import styles from './JoinRoomPage.module.css';

const JoinRoomPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isAuthenticated } = useAppSelector((state) => state.user);
    const hasToken = Boolean(localStorage.getItem('accessToken'));
    const isUserLoggedIn = isAuthenticated || hasToken;

    const normalizedCode = (code || '').trim().toUpperCase();

    useEffect(() => {
        if (!normalizedCode) {
            navigate('/game', { replace: true });
            return;
        }

        // Always store pending room code for post-login redirection if needed
        sessionStorage.setItem('pendingJoinCode', normalizedCode);

        // If user is already logged in, immediately redirect to game lobby with join parameter
        if (isUserLoggedIn) {
            navigate(`/game?join=${normalizedCode}`, { replace: true });
        }
    }, [normalizedCode, isUserLoggedIn, navigate]);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>🎵</div>
                <h1 className={styles.title}>{t('joinPage.title')}</h1>
                <p className={styles.subtitle}>{t('joinPage.subtitle')}</p>

                <div className={styles.codeBox}>
                    <span className={styles.codeLabel}>{t('joinPage.roomCode')}</span>
                    <span className={styles.codeValue}>{normalizedCode}</span>
                </div>

                {isUserLoggedIn ? (
                    <div className={styles.joiningState}>
                        <Loader />
                        <span className={styles.joiningText}>{t('joinPage.joining')}</span>
                    </div>
                ) : (
                    <>
                        <p className={styles.promptText}>{t('joinPage.loginRequired')}</p>
                        <div className={styles.actions}>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/auth/login')}
                            >
                                {t('joinPage.loginBtn')}
                            </Button>
                            <Button
                                variant="neutral"
                                onClick={() => navigate('/auth/register')}
                            >
                                {t('joinPage.registerBtn')}
                            </Button>
                        </div>
                    </>
                )}

                <div>
                    <Link to="/" className={styles.backLink}>
                        &larr; {t('joinPage.backHome')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default JoinRoomPage;
