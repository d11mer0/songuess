import { useEffect, useRef, useState, useCallback } from 'react';
import { calculateStartTime } from '../utils/calculateStartTime';

interface UseAudioPlayerArgs {
    previewUrl: string | null;
    startedAt: number | null;
    initialVolume?: number;
    maxPlayDuration?: number;
}

export const useAudioPlayer = ({
    previewUrl,
    startedAt,
    initialVolume = 0.1,
    maxPlayDuration,
}: UseAudioPlayerArgs) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [volume, setVolume] = useState(initialVolume);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

    const resumeAudio = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !previewUrl || !startedAt) return;

        const currentTargetTime = calculateStartTime(startedAt);
        if (Number.isFinite(currentTargetTime)) {
            try {
                audio.currentTime = currentTargetTime;
            } catch (e) {
                console.warn('Could not seek audio on resume', e);
            }
        }

        audio.volume = volume;
        audio.play()
            .then(() => {
                setIsPlaying(true);
                setIsAutoplayBlocked(false);
            })
            .catch((err) => {
                console.warn('Playback still prevented on resume', err);
            });
    }, [previewUrl, startedAt, volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!previewUrl || !startedAt) {
            audio.pause();
            setIsPlaying(false);
            setIsAutoplayBlocked(false);
            return;
        }

        audio.pause();
        audio.src = previewUrl;
        audio.volume = volume;

        const applySeekAndPlay = () => {
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
                        setIsPlaying(true);
                        setIsAutoplayBlocked(false);
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
        }

        return () => {
            audio.removeEventListener('loadedmetadata', applySeekAndPlay);
        };
    }, [previewUrl, startedAt]);

    // Автоматичне зняття блокування звуку при першому кліку / взаємодії користувача
    useEffect(() => {
        if (!isAutoplayBlocked) return;

        const handleUserGesture = () => {
            resumeAudio();
        };

        window.addEventListener('click', handleUserGesture, { once: true, capture: true });
        window.addEventListener('keydown', handleUserGesture, { once: true, capture: true });
        window.addEventListener('touchstart', handleUserGesture, { once: true, capture: true });
        window.addEventListener('pointerdown', handleUserGesture, { once: true, capture: true });

        return () => {
            window.removeEventListener('click', handleUserGesture, { capture: true });
            window.removeEventListener('keydown', handleUserGesture, { capture: true });
            window.removeEventListener('touchstart', handleUserGesture, { capture: true });
            window.removeEventListener('pointerdown', handleUserGesture, { capture: true });
        };
    }, [isAutoplayBlocked, resumeAudio]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
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