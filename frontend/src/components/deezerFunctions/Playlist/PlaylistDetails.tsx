import styles from './PlaylistDetails.module.css';
import { useTranslation } from '../../../i18n/LanguageContext';

interface PlaylistDetailsProps {
    details: {
        title: string;
        picture_big: string;
        description?: string;
        fans?: number;
    };
}

const PlaylistDetails: React.FC<PlaylistDetailsProps> = ({ details }) => {
    const { t } = useTranslation();

    return (
        <div className={styles.playlistInfo}>
            <img
                src={details.picture_big || 'https://via.placeholder.com/150'}
                alt={details.title}
                className={styles.playlistCover}
            />
            <div className={styles.playlistDetails}>
                <h3 className={styles.playlistTitle}>{details.title}</h3>

                {details.description && (
                    <p className={styles.playlistDescription}>{details.description}</p>
                )}

                {details.fans !== undefined && (
                    <p className={styles.playlistMeta}>
                        <span>{t('gameCreation.fansLabel')}:</span> {details.fans.toLocaleString()}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PlaylistDetails;