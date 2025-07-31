import React from 'react';
import styles from './TrackPreviewSummary.module.css';
import { Track } from '../TrackList';
import { BsMusicNoteBeamed } from 'react-icons/bs';

interface TrackPreviewSummaryProps {
    tracks: Track[];
}

const TrackPreviewSummary: React.FC<TrackPreviewSummaryProps> = ({ tracks }) => {
    if (tracks.length === 0) return null;

    const previewTracks = tracks.slice(0, 3);

    return (
        <div className={styles.summaryWrapper}>
            <h3 className={styles.heading}>
                <BsMusicNoteBeamed style={{ marginRight: '6px' }} />
                Selected collection includes {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
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
                {tracks.length > 3 && <span className={styles.more}>and more tracks in this collection...</span>}
            </p>
        </div>
    );
};

export default TrackPreviewSummary;