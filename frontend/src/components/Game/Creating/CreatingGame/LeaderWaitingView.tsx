import { FC } from 'react';
import styles from '../CreatingGame.module.css';
import WaitingLoader from '../../../UI/Loader/WaitingLoader/WaitingLoader';
import { useTranslation } from '../../../../i18n/LanguageContext';

const LeaderWaitingView: FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <div className={styles.waitingHeader}>
                <div className={styles.emptyText}>
                    <span className={styles.emoji}>🕹️</span> {t('gameCreation.hostPreparingTitle')}
                </div>
                <div className={styles.emptySubtext}>
                    {t('gameCreation.hostPreparingSubtext')} <span className={styles.emoji}>⏳</span>
                </div>
            </div>
            <WaitingLoader />
        </>
    );
};

export default LeaderWaitingView;