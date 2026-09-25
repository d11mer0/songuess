import { useEffect, useRef, useState, useCallback } from 'react';
import { calculateStartTime } from '../utils/calculateStartTime';
import {
    blockMediaSessionHardwareKeys,
    clearMediaSessionPlayback,
} from '../utils/audio/blockMediaSessionHardwareKeys';

interface UseAudioPlayerArgs {
    previewUrl: string | null;
    startedAt: number | null;
    initialVolume?: number;
    maxPlayDuration?: number;
}

const getSavedVolume = (fallback: number): number => {
    if (typeof window === 'undefined') return fallback;
    const stored = localStorage.getItem('songuess_music_volume');
    if (stored !== null) {
        const parsed = parseFloat(stored);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            return parsed;
        }
    }
    return 0.7;
};

export const useAudioPlayer = ({
    previewUrl,
    startedAt,
    initialVolume = 0.7,
    maxPlayDuration,
}: UseAudioPlayerArgs) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [volume, setVolumeState] = useState(() => getSavedVolume(initialVolume));
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

    // Refs — завжди містять актуальні значення без залежності від useCallback deps.
    // Це ключово для resumeAudio: час рахується ЗАРАЗ, а не в момент створення closure.
    const startedAtRef = useRef<number | null>(startedAt);
    const previewUrlRef = useRef<string | null>(previewUrl);
    const volumeRef = useRef<number>(volume);
    // Захист від double-call (window capture + overlay onClick спрацьовують разом)
    const isResumingRef = useRef(false);

    startedAtRef.current = startedAt;
    previewUrlRef.current = previewUrl;
    volumeRef.current = volume;

    const setVolume = useCallback((newVolume: number) => {
        setVolumeState(newVolume);
        if (typeof window !== 'undefined') {
            localStorage.setItem('songuess_music_volume', String(newVolume));
        }
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    }, []);

    /**
     * resumeAudio — відновлення після autoplay block.
     *
     * Час рахується ЩОРАЗУ при виклику (refs актуальні), тому
     * затримка між блокуванням і кліком коректно враховується.
     * isResumingRef запобігає double-call від window listener + onClick.
     */
    const resumeAudio = useCallback(() => {
        if (isResumingRef.current) return; // захист від double-call
        const audio = audioRef.current;
        const currentPreviewUrl = previewUrlRef.current;
        const currentStartedAt = startedAtRef.current;
        const currentVolume = volumeRef.current;

        if (!audio || !currentPreviewUrl || !currentStartedAt) return;

        isResumingRef.current = true;

        // Рахуємо ПОТОЧНИЙ час — враховує час очікування на оверлеї
        const seekTo = calculateStartTime(currentStartedAt);
        if (Number.isFinite(seekTo)) {
            try {
                audio.currentTime = seekTo;
            } catch (e) {
                console.warn('Could not seek audio on resume', e);
            }
        }

        audio.volume = currentVolume;
        audio.play()
            .then(() => {
                // Мікрокорекція після реального старту відтворення
                const correctedSeek = calculateStartTime(currentStartedAt);
                if (Number.isFinite(correctedSeek) && Math.abs(audio.currentTime - correctedSeek) > 0.3) {
                    try { audio.currentTime = correctedSeek; } catch {}
                }
                setIsPlaying(true);
                setIsAutoplayBlocked(false);
                isResumingRef.current = false;
            })
            .catch((err) => {
                console.warn('Playback still prevented on resume', err);
                isResumingRef.current = false;
            });
    }, []); // Порожній deps — всі значення беруться з refs

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        blockMediaSessionHardwareKeys(audio);

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);
        const onWaiting = () => {
            if (audio.ended || (audio.duration && audio.currentTime >= audio.duration - 0.2)) {
                setIsPlaying(false);
            }
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('waiting', onWaiting);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('waiting', onWaiting);
            clearMediaSessionPlayback(audio);
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!previewUrl || !startedAt) {
            clearMediaSessionPlayback(audio);
            setIsPlaying(false);
            setIsAutoplayBlocked(false);
            return;
        }

        audio.pause();
        audio.src = previewUrl;
        audio.volume = volume;
        setIsPlaying(false);

        let hasStarted = false;

        const applySeekAndPlay = () => {
            if (hasStarted) return;
            hasStarted = true;

            // Час рахується ЗАРАЗ — важливо якщо loadedmetadata затримався
            const playbackStartTime = calculateStartTime(startedAt);
            if (Number.isFinite(playbackStartTime)) {
                try {
                    audio.currentTime = playbackStartTime;
                } catch (e) {
                    console.warn('Could not seek audio', e);
                }
            }

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Мікрокорекція після старту
                        const correctedTime = calculateStartTime(startedAt);
                        if (Number.isFinite(correctedTime) && Math.abs(audio.currentTime - correctedTime) > 0.3) {
                            try { audio.currentTime = correctedTime; } catch {}
                        }
                        setIsPlaying(true);
                        setIsAutoplayBlocked(false);
                        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
                            try {
                                navigator.mediaSession.playbackState = 'playing';
                            } catch {}
                        }
                    })
                    .catch((err) => {
                        console.warn('Autoplay blocked by browser policy:', err);
                        setIsPlaying(false);
                        setIsAutoplayBlocked(true);
                    });
            }
        };

        if (audio.readyState >= 1) {
            applySeekAndPlay();
        } else {
            audio.addEventListener('loadedmetadata', applySeekAndPlay, { once: true });
            audio.addEventListener('canplay', applySeekAndPlay, { once: true });
        }

        return () => {
            hasStarted = true;
            audio.removeEventListener('loadedmetadata', applySeekAndPlay);
            audio.removeEventListener('canplay', applySeekAndPlay);
            clearMediaSessionPlayback(audio);
        };
    }, [previewUrl, startedAt]);

    // Window listeners — спрацьовують на будь-який жест.
    // Refs гарантують свіжий startedAt без стейл-closure.
    useEffect(() => {
        if (!isAutoplayBlocked) return;

        const removeListeners = () => {
            window.removeEventListener('click', handleUserGesture, { capture: true });
            window.removeEventListener('keydown', handleUserGesture, { capture: true });
            window.removeEventListener('touchstart', handleUserGesture, { capture: true });
            window.removeEventListener('pointerdown', handleUserGesture, { capture: true });
        };

        const handleUserGesture = () => {
            if (!audioRef.current || !previewUrlRef.current || !startedAtRef.current) return;
            removeListeners();
            resumeAudio();
        };

        window.addEventListener('click', handleUserGesture, { capture: true });
        window.addEventListener('keydown', handleUserGesture, { capture: true });
        window.addEventListener('touchstart', handleUserGesture, { capture: true });
        window.addEventListener('pointerdown', handleUserGesture, { capture: true });

        return removeListeners;
    }, [isAutoplayBlocked, resumeAudio]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (audio.paused || audio.ended) {
                setIsPlaying(false);
                return;
            }
            if (maxPlayDuration && audio.currentTime >= maxPlayDuration) {
                audio.pause();
                setIsPlaying(false);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [maxPlayDuration]);

    useEffect(() => {
        if (audioRef.current && maxPlayDuration) {
            const audio = audioRef.current;
            if (audio.paused && audio.currentTime < maxPlayDuration && !isAutoplayBlocked) {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => {});
            }
        }
    }, [maxPlayDuration, isAutoplayBlocked]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    return {
        audioRef,
        volume,
        setVolume,
        isPlaying,
        isAutoplayBlocked,
        resumeAudio,
    };
};
