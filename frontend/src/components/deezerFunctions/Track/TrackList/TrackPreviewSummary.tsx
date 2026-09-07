import React from 'react';
import styles from './TrackPreviewSummary.module.css';
import { Track } from '../TrackList';
import { BsMusicNoteBeamed } from 'react-icons/bs';
import { useTranslation } from '../../../../i18n/LanguageContext';

interface TrackPreviewSummaryProps {
    tracks: Track[];
}

const TrackPreviewSummary: React.FC<TrackPreviewSummaryProps> = ({ tracks }) => {
    const { t } = useTranslation();
    if (tracks.length === 0) return null;

    const previewTracks = tracks.slice(0, 3);

    return (
        <div className={styles.summaryWrapper}>
            <h3 className={styles.heading}>
                <BsMusicNoteBeamed style={{ marginRight: '6px' }} />
                {t('gameplay.selectedCollectionIncludes', { count: tracks.length })}
            </h3>

            <p className={styles.preview}>
                {previewTracks.map((track, index) => (
                    <React.Fragment key={track.id || index}>
                        <span key={track.id || index} className={styles.trackItem}>
                            ”{track.title}"
                        </span>
                        {index < previewTracks.length - 1 ? ', ' : ' '}
                    </React.Fragment>
                ))}
                {tracks.length > 3 && <span className={styles.more}>{t('gameplay.andMoreTracks')}</span>}
            </p>
        </div>
    );
};

export default TrackPreviewSummary;