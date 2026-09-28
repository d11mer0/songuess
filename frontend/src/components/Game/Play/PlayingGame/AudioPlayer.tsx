import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { selectTrackInfo, selectRoundResult } from '../../../../store/gameplay/gameplaySelectors';
import { useAudioPlayer } from '../../../../hooks/useAudioPlayer';
import { soundEffects } from '../../../../utils/audio/soundEffects';

import {
    FaVolumeUp,
    FaVolumeDown,
    FaVolumeMute,
    FaBell,
    FaBellSlash,
    FaSlidersH,
    FaTimes,
    FaMusic,
} from 'react-icons/fa';
import styles from './AudioPlayer.module.css';
import { useTranslation } from '../../../../i18n/LanguageContext';
import { clearMediaSessionPlayback } from '../../../../utils/audio/blockMediaSessionHardwareKeys';

interface AudioPlayerProps {
    maxPlayDuration?: number;
    onPlayingChange?: (isPlaying: boolean) => void;
}

const PRESETS = [
    { label: '0%', value: 0 },
    { label: '30%', value: 0.3 },
    { label: '70%', value: 0.7 },
    { label: '100%', value: 1.0 },
];

const AudioPlayer: React.FC<AudioPlayerProps> = ({ maxPlayDuration, onPlayingChange }) => {
    const { t } = useTranslation();
    const trackInfo = useAppSelector(selectTrackInfo);
    const roundResult = useAppSelector(selectRoundResult);

    const [isOpen, setIsOpen] = useState(false);
    const [sfxMuted, setSfxMuted] = useState(() => soundEffects.isMuted());

    const { audioRef, volume, setVolume, isPlaying, isAutoplayBlocked, resumeAudio } = useAudioPlayer({
        previewUrl: trackInfo?.preview ?? null,
        startedAt: trackInfo?.startedAt ?? null,
        initialVolume: 0.7,
        maxPlayDuration,
    });

    const previousVolumeRef = useRef<number>(volume > 0 ? volume : 0.7);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    // Keep previous non-zero volume updated
    useEffect(() => {
        if (volume > 0) {
            previousVolumeRef.current = volume;
        }
    }, [volume]);

    useEffect(() => {
        onPlayingChange?.(isPlaying);
    }, [isPlaying, onPlayingChange]);

    useEffect(() => {
        return () => {
            onPlayingChange?.(false);
        };
    }, [onPlayingChange]);

    // Коли раунд закінчується і показуються результати, ставимо аудіо на паузу та очищаємо сесію
    useEffect(() => {
        if (roundResult && audioRef.current) {
            audioRef.current.pause();
            clearMediaSessionPlayback(audioRef.current);
            onPlayingChange?.(false);
        }
    }, [roundResult, audioRef, onPlayingChange]);

    useEffect(() => {
        const unsubscribe = soundEffects.onMuteChange(setSfxMuted);
        return unsubscribe;
    }, []);

    // Outside click & Escape to close popover
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            if (
                popoverRef.current &&
                !popoverRef.current.contains(target) &&
                triggerRef.current &&
                !triggerRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (volume > 0) {
            previousVolumeRef.current = volume;
            setVolume(0);
        } else {
            const restored = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.7;
            setVolume(restored);
        }
    };

    const toggleSfx = () => {
        const next = soundEffects.toggleMute();
        setSfxMuted(next);
        if (!next) {
            soundEffects.playCorrect();
        }
    };

    const renderVolumeIcon = () => {
        if (volume === 0) {
            return <FaVolumeMute className={styles.volumeIconMuted} />;
        }
        if (volume < 0.5) {
            return <FaVolumeDown className={styles.volumeIconLow} />;
        }
        return <FaVolumeUp className={styles.volumeIconHigh} />;
    };

    if (!trackInfo) return null;

    return (
        <>
            {/* Fullscreen overlay — з'являється коли браузер блокує autoplay */}
            {isAutoplayBlocked && (
                <div
                    className={styles.autoplayOverlay}
                    onClick={resumeAudio}
                    role="button"
                    aria-label={t('gameplay.tapToUnmuteTitle')}
                >
                    <div className={styles.autoplayCard}>
                        <span className={styles.autoplayIcon}>🔊</span>
                        <p className={styles.autoplayTitle}>{t('gameplay.tapToUnmuteTitle')}</p>
                        <p className={styles.autoplaySubtitle}>{t('gameplay.tapToUnmuteSubtitle')}</p>
                    </div>
                    <p className={styles.autoplayHint}>{t('gameplay.tapToUnmuteHint')}</p>
                </div>
            )}

            <div className={styles.widgetWrapper}>
                <audio ref={audioRef} style={{ display: 'none' }} />

                {/* Main Interactive Trigger Pill */}
                <div className={`${styles.triggerPill} ${isOpen ? styles.triggerOpen : ''}`}>
                    <button
                        type="button"
                        className={styles.quickMuteBtn}
                        onClick={toggleMute}
                        title={volume === 0 ? t('gameplay.unmute') : t('gameplay.mute')}
                        aria-label={volume === 0 ? t('gameplay.unmute') : t('gameplay.mute')}
                    >
                        {renderVolumeIcon()}
                    </button>

                    <button
                        ref={triggerRef}
                        type="button"
                        className={styles.settingsToggleBtn}
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-expanded={isOpen}
                        aria-label={t('gameplay.soundSettings')}
                        title={t('gameplay.soundSettings')}
                    >
                        {isPlaying && volume > 0 && (
                            <span className={styles.equalizer} aria-hidden="true">
                                <span className={styles.bar} />
                                <span className={styles.bar} />
                                <span className={styles.bar} />
                            </span>
                        )}

                        <span className={styles.volumePercentText}>
                            {volume === 0 ? '0%' : `${Math.round(volume * 100)}%`}
                        </span>

                        <span
                            className={styles.sfxBadge}
                            title={sfxMuted ? 'SFX Off' : 'SFX On'}
                        >
                            {sfxMuted ? (
                                <FaBellSlash className={styles.sfxBadgeIconMuted} />
                            ) : (
                                <FaBell className={styles.sfxBadgeIcon} />
                            )}
                        </span>

                        <FaSlidersH className={`${styles.slidersIcon} ${isOpen ? styles.rotated : ''}`} />
                    </button>
                </div>

                {/* Modern Sound Settings Popover */}
                {isOpen && (
                    <div
                        ref={popoverRef}
                        className={styles.settingsCard}
                        role="dialog"
                        aria-label={t('gameplay.soundSettings')}
                    >
                        {/* Header */}
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                                <FaSlidersH className={styles.headerIcon} />
                                <span>{t('gameplay.soundSettings')}</span>
                            </div>
                            <button
                                type="button"
                                className={styles.closeBtn}
                                onClick={() => setIsOpen(false)}
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Music Volume Section */}
                        <div className={styles.controlGroup}>
                            <div className={styles.controlLabelRow}>
                                <span className={styles.groupTitle}>
                                    <FaMusic className={styles.musicIcon} />
                                    {t('gameplay.musicVolume')}
                                </span>
                                <span className={styles.percentageBadge}>
                                    {Math.round(volume * 100)}%
                                </span>
                            </div>

                            <div className={styles.sliderRow}>
                                <button
                                    type="button"
                                    className={styles.sliderIconBtn}
                                    onClick={toggleMute}
                                    title={volume === 0 ? t('gameplay.unmute') : t('gameplay.mute')}
                                >
                                    {volume === 0 ? <FaVolumeMute /> : <FaVolumeDown />}
                                </button>

                                <div className={styles.sliderTrackContainer}>
                                    <input
                                        type="range"
                                        className={styles.neonSlider}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={volume}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setVolume(val);
                                        }}
                                        style={{
                                            ['--slider-fill-percent' as any]: `${volume * 100}%`,
                                        }}
                                        aria-label={t('gameplay.musicVolume')}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={styles.sliderIconBtn}
                                    onClick={() => setVolume(1.0)}
                                    title="100%"
                                >
                                    <FaVolumeUp />
                                </button>
                            </div>

                            {/* Quick Presets */}
                            <div className={styles.presetsRow}>
                                {PRESETS.map((p) => {
                                    const isCurrent = Math.abs(volume - p.value) < 0.04;
                                    return (
                                        <button
                                            key={p.label}
                                            type="button"
                                            className={`${styles.presetBtn} ${isCurrent ? styles.presetActive : ''}`}
                                            onClick={() => setVolume(p.value)}
                                        >
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className={styles.divider} />

                        {/* Sound Effects Section */}
                        <div className={styles.sfxRow}>
                            <div className={styles.sfxInfo}>
                                <div className={styles.sfxTitleRow}>
                                    {sfxMuted ? (
                                        <FaBellSlash className={styles.sfxMutedIcon} />
                                    ) : (
                                        <FaBell className={styles.sfxActiveIcon} />
                                    )}
                                    <span className={styles.groupTitle}>{t('gameplay.soundEffects')}</span>
                                </div>
                                <span className={styles.sfxHintText}>{t('gameplay.sfxHint')}</span>
                            </div>

                            {/* Cyberpunk Animated Toggle Switch */}
                            <button
                                type="button"
                                role="switch"
                                aria-checked={!sfxMuted}
                                className={`${styles.switchTrack} ${!sfxMuted ? styles.switchOn : styles.switchOff}`}
                                onClick={toggleSfx}
                                title={sfxMuted ? t('gameplay.unmute') : t('gameplay.mute')}
                            >
                                <span className={styles.switchThumb} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AudioPlayer;
