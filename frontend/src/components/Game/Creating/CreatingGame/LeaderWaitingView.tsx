import { FC } from 'react';
import styles from '../CreatingGame.module.css';
import WaitingLoader from '../../../UI/Loader/WaitingLoader/WaitingLoader';

const LeaderWaitingView: FC = () => {
    return (
        <>
            <h3 className={styles.sectionTitle}>
                <div className={styles.emptyText}>
                    <span className={styles.emoji}>🕹️</span> The host is preparing the game
                </div>
                <div className={styles.emptySubtext}>
                    Sit tight while your leader sets everything up! <span className={styles.emoji}>⏳</span>
                </div>
            </h3>
            <WaitingLoader />
        </>
    );
};

export default LeaderWaitingView;