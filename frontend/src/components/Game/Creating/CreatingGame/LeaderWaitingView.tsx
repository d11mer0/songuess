import { FC } from 'react';
import styles from '../CreatingGame.module.css';
import WaitingLoader from '../../../UI/Loader/WaitingLoader/WaitingLoader';
import { useTranslation } from '../../../../i18n/LanguageContext';

const LeaderWaitingView: FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <h3 className={styles.sectionTitle}>
                <div className={styles.emptyText}>
                    <span className={styles.emoji}>🕹️</span> {t('gameCreation.hostPreparingTitle')}
                </div>
                <div className={styles.emptySubtext}>
                    {t('gameCreation.hostPreparingSubtext')} <span className={styles.emoji}>⏳</span>
                </div>
            </h3>
            <WaitingLoader />
        </>
    );
};

export default LeaderWaitingView;