import { useAppSelector } from '../../../../store/hooks';
import { selectTrackInfo, selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import { useAudioPlayer } from '../../../../hooks/useAudioPlayer';
import { soundEffects } from '../../../../utils/audio/soundEffects';

import { FaVolumeUp, FaVolumeMute, FaBell, FaBellSlash } from 'react-icons/fa';
import { MdVolumeOff, MdVolumeUp } from 'react-icons/md';
import styles from './AudioPlayer.module.css';
import { useState, useEffect } from 'react';
import { useTranslation } from '../../../../i18n/LanguageContext';

interface AudioPlayerProps {
    maxPlayDuration?: number;
    onPlayingChange?: (isPlaying: boolean) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ maxPlayDuration, onPlayingChange }) => {
    const { t } = useTranslation();
    const trackInfo = useAppSelector(selectTrackInfo);
    const roundResult = useAppSelector(selectRoundResult);
    const [showSlider, setShowSlider] = useState(false);
    const [sfxMuted, setSfxMuted] = useState(() => soundEffects.isMuted());

    const { audioRef, volume, setVolume, isPlaying, isAutoplayBlocked, resumeAudio } = useAudioPlayer({
        previewUrl: trackInfo?.preview ?? null,
        startedAt: trackInfo?.startedAt ?? null,
        initialVolume: 0.1,
        maxPlayDuration,
    });

    useEffect(() => {
        onPlayingChange?.(isPlaying);
    }, [isPlaying, onPlayingChange]);

    // Коли раунд закінчується і показуються результати, ставимо аудіо на паузу
    useEffect(() => {
        if (roundResult && audioRef.current) {
            audioRef.current.pause();
        }
    }, [roundResult, audioRef]);

    useEffect(() => {
        const unsubscribe = soundEffects.onMuteChange(setSfxMuted);
        return unsubscribe;
    }, []);

    const toggleSfx = () => {
        const next = soundEffects.toggleMute();
        setSfxMuted(next);
    };

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
        <div className={styles.controlsRow}>
            <audio ref={audioRef} style={{ display: 'none' }} />

            {isAutoplayBlocked && (
                <button
                    type="button"
                    onClick={resumeAudio}
                    className={styles.unmuteBanner}
                    title={t('gameplay.unmuteAlert')}
                >
                    <FaVolumeMute className={styles.pulseMuteIcon} />
                    <span>{t('gameplay.unmuteAlert')}</span>
                </button>
            )}

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
                        <span className={styles.sliderLabel}>Music</span>
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
                                    ['--slider-track-fill' as any]: getSliderBackground(volume),
                                }}
                            />
                            <MdVolumeUp className={styles.sideIcon} />
                        </div>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={toggleSfx}
                className={styles.sfxButton}
                title={sfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
                {sfxMuted ? (
                    <FaBellSlash className={styles.sfxIconMuted} />
                ) : (
                    <FaBell className={styles.sfxIcon} />
                )}
                <span className={styles.sfxLabel}>SFX</span>
            </button>
        </div>
    );
};

export default AudioPlayer;