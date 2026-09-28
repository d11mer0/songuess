import React from 'react';
import styles from './Loader.module.css';
import { useTranslation } from '../../../../i18n/LanguageContext';
import { FaMusic } from 'react-icons/fa';

interface LoaderProps {
    text?: string;
    subtext?: string;
    isFullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ text, subtext, isFullScreen = false }) => {
    const { t } = useTranslation();
    const displayText = text ?? t('common.loading');

    return (
        <div className={`${styles.loaderContainer} ${isFullScreen ? styles.fullScreen : ''}`}>
            <div className={styles.glowCard}>
                <div className={styles.spinnerWrapper}>
                    <div className={styles.outerRing}></div>
                    <div className={styles.innerRing}></div>
                    <div className={styles.centerIcon}>
                        <FaMusic className={styles.musicIcon} />
                    </div>
                </div>
                <div className={styles.textWrapper}>
                    <p className={styles.title}>{displayText}</p>
                    {subtext && <p className={styles.subtext}>{subtext}</p>}
                </div>
                <div className={styles.pulseBarWrapper}>
                    <div className={styles.pulseBar}></div>
                </div>
            </div>
        </div>
    );
};

export default Loader;
