import styles from '../RoomList.module.css';
import { useTranslation } from '../../../../../i18n/LanguageContext';

const EmptyRoomListState = () => {
    const { t } = useTranslation();

    return (
        <h3 className={styles.sectionTitle}>
            <div className={styles.emptyText}>
                <span className={styles.emoji}>😢</span> {t('lobby.noRooms')}
            </div>
        </h3>
    );
};

export default EmptyRoomListState;