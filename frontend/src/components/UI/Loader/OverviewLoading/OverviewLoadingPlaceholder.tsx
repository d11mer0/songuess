import styles from '../../../deezerFunctions/Album/AlbumOverview.module.css';

interface OverviewLoadingPlaceholderProps {
    loadingText?: string;
}

const OverviewLoadingPlaceholder = ({ loadingText = 'Loading album data...' }: OverviewLoadingPlaceholderProps) => {
    return (
        <div className={styles.albumContainer}>
            <div className={styles.albumInfo}>
                <div className={`${styles.albumCover} ${styles.skeleton}`} />
                <div className={styles.albumDetails}>
                    <div className={`${styles.albumTitle} ${styles.skeletonText}`} />
                    <div className={`${styles.artistName} ${styles.skeletonText}`} />
                </div>
            </div>

            <div className={styles.loadingTrackList}>
                <p>{loadingText}</p>
                <div className={styles.spinner} />
            </div>
        </div>
    );
};

export default OverviewLoadingPlaceholder;