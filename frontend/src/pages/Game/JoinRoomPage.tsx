import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useTranslation } from '../../i18n/LanguageContext';
import { useCheckRoomQuery } from '../../store/api/gameApi';
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

    const { data: roomCheck, isLoading: isCheckingRoom, error: checkError } = useCheckRoomQuery(
        normalizedCode,
        { skip: !normalizedCode }
    );

    useEffect(() => {
        if (!normalizedCode) {
            navigate('/game', { replace: true });
            return;
        }

        if (roomCheck?.exists) {
            sessionStorage.setItem('pendingJoinCode', normalizedCode);

            if (isUserLoggedIn) {
                navigate(`/game?join=${normalizedCode}`, { replace: true });
            }
        }
    }, [normalizedCode, roomCheck, isUserLoggedIn, navigate]);

    const isRoomNotFound = (!isCheckingRoom && roomCheck && !roomCheck.exists) || Boolean(checkError);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>{isRoomNotFound ? '⚠️' : '🎵'}</div>
                <h1 className={styles.title}>{t('joinPage.title')}</h1>
                <p className={styles.subtitle}>
                    {isRoomNotFound ? t('party.roomNotFoundOrClosed') : t('joinPage.subtitle')}
                </p>

                <div className={styles.codeBox}>
                    <span className={styles.codeLabel}>{t('joinPage.roomCode')}</span>
                    <span className={styles.codeValue}>{normalizedCode}</span>
                </div>

                {isCheckingRoom ? (
                    <div className={styles.joiningState}>
                        <Loader />
                        <span className={styles.joiningText}>{t('party.checkingRoom')}</span>
                    </div>
                ) : isRoomNotFound ? (
                    <div className={styles.actions} style={{ marginTop: '20px' }}>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/game')}
                        >
                            {t('party.backToLobby')}
                        </Button>
                    </div>
                ) : isUserLoggedIn ? (
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
