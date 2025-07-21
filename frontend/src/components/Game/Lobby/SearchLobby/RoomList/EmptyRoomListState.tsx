import styles from '../RoomList.module.css';

const EmptyRoomListState = () => {
    return (
        <h3 className={styles.sectionTitle}>
            <div className={styles.emptyText}>
                <span className={styles.emoji}>😢</span> No rooms available at the moment
            </div>
            <div className={styles.emptySubtext}>
                Why not create your own lobby and invite friends? <span className={styles.emoji}>🎮</span>
            </div>
        </h3>
    );
};

export default EmptyRoomListState;