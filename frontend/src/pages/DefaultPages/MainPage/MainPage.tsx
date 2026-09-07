import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MainPage.module.css';
import { useTranslation } from '../../../i18n/LanguageContext';

const MainPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.badgeRow}>
                    <span className={styles.neonPill}>🎵 Realtime Music Trivia</span>
                    <span className={styles.neonPill}>⚡ 1v1 Blitz</span>
                    <span className={styles.neonPill}>🎧 Heardle</span>
                </div>

                <h1 className={styles.title}>{t('mainPage.heroTitle')}</h1>
                <p className={styles.subtitle}>{t('mainPage.heroSubtitle')}</p>
                <p className={styles.description}>{t('mainPage.heroDesc')}</p>

                <div className={styles.ctaRow}>
                    <button
                        className={`${styles.ctaBtn} ${styles.primaryCta}`}
                        onClick={() => navigate('/game')}
                    >
                        {t('mainPage.btnPlay')}
                    </button>
                    <button
                        className={`${styles.ctaBtn} ${styles.dailyCta}`}
                        onClick={() => navigate('/game/daily')}
                    >
                        {t('mainPage.btnDaily')}
                    </button>
                    <button
                        className={`${styles.ctaBtn} ${styles.leaderboardCta}`}
                        onClick={() => navigate('/game/leaderboards')}
                    >
                        {t('mainPage.btnLeaderboard')}
                    </button>
                </div>

                <div className={styles.featuresGrid}>
                    <div className={styles.featureCard} onClick={() => navigate('/game')}>
                        <div className={styles.featureIcon}>⚡</div>
                        <h3 className={styles.featureTitle}>{t('mainPage.featureDuelTitle')}</h3>
                        <p className={styles.featureDesc}>{t('mainPage.featureDuelDesc')}</p>
                    </div>

                    <div className={styles.featureCard} onClick={() => navigate('/game')}>
                        <div className={styles.featureIcon}>⏱️</div>
                        <h3 className={styles.featureTitle}>{t('mainPage.featureHeardleTitle')}</h3>
                        <p className={styles.featureDesc}>{t('mainPage.featureHeardleDesc')}</p>
                    </div>

                    <div className={styles.featureCard} onClick={() => navigate('/game/daily')}>
                        <div className={styles.featureIcon}>🎵</div>
                        <h3 className={styles.featureTitle}>{t('mainPage.featureDailyTitle')}</h3>
                        <p className={styles.featureDesc}>{t('mainPage.featureDailyDesc')}</p>
                    </div>

                    <div className={styles.featureCard} onClick={() => navigate('/game/leaderboards')}>
                        <div className={styles.featureIcon}>🏆</div>
                        <h3 className={styles.featureTitle}>{t('mainPage.featureRankTitle')}</h3>
                        <p className={styles.featureDesc}>{t('mainPage.featureRankDesc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainPage;