import { useAppSelector } from '../../../../store/hooks';
import { selectTrackInfo } from '../../../../store/gameplay/gameplaySelectors';
import { useAudioPlayer } from '../../../../hooks/useAudioPlayer';

import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { MdVolumeOff, MdVolumeUp } from 'react-icons/md';
import styles from './AudioPlayer.module.css';
import { useState } from 'react';

const AudioPlayer = () => {
    const trackInfo = useAppSelector(selectTrackInfo);
    const [showSlider, setShowSlider] = useState(false);

    const { audioRef, volume, setVolume } = useAudioPlayer({
        previewUrl: trackInfo?.preview ?? null,
        startedAt: trackInfo?.startedAt ?? null,
        initialVolume: 0.1,
    });

    const getSliderBackground = (value: number): string => {
        const percent = value * 100;
        return `linear-gradient(to right, 
            var(--primary-color) 0%, 
            var(--primary-color) ${percent}%, 
            var(--background-highlight) ${percent}%, 
            var(--background-highlight) 100%)`;
    };

    if (!trackInfo) return null;

    return (
        <>
            <audio ref={audioRef} style={{ display: 'none' }} />
            <div
                className={styles.volumeContainer}
                onMouseEnter={() => setShowSlider(true)}
                onMouseLeave={() => setShowSlider(false)}
            >
                {volume === 0 ? (
                    <FaVolumeMute className={styles.volumeIcon} />
                ) : (
                    <FaVolumeUp className={styles.volumeIcon} />
                )}
                {showSlider && (
                    <div className={styles.sliderPopup}>
                        <span className={styles.sliderLabel}>Volume</span>
                        <div className={styles.sliderRow}>
                            <MdVolumeOff className={styles.sideIcon} />
                            <input
                                type="range"
                                className={`${styles.volumeSlider} ${styles.volumeSliderDynamicTrack}`}
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                style={{
                                    // inline змінна для псевдоелементів
                                    ['--slider-track-fill' as any]: getSliderBackground(volume),
                                }}
                            />
                            <MdVolumeUp className={styles.sideIcon} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AudioPlayer;
