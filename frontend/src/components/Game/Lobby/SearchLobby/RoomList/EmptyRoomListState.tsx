import styles from '../RoomList.module.css';
import { useTranslation } from '../../../../../i18n/LanguageContext';

const EmptyRoomListState = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.emptyContainer}>
            <div className={styles.emptyText}>
                <span className={styles.emoji}>🥺</span> {t('lobby.noRooms')}
            </div>
        </div>
    );
};

export default EmptyRoomListState;