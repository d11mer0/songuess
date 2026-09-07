import { useEffect, useRef, useState } from 'react';
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
        if (audioRef.current && previewUrl && startedAt) {
            const audio = audioRef.current;
            const playbackStartTime = calculateStartTime(startedAt);

            audio.pause();
            audio.src = previewUrl;
            audio.currentTime = playbackStartTime;
            audio.volume = volume;

            audio.play()
                .then(() => setIsPlaying(true))
                .catch((err) => {
                    console.error('Error playing audio', err);
                    setIsPlaying(false);
                });
        }
    }, [previewUrl, startedAt]);

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
            if (audio.paused && audio.currentTime < maxPlayDuration) {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => {});
            }
        }
    }, [maxPlayDuration]);

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
    };
};