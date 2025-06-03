import { useEffect, useRef, useState } from 'react';
import { calculateStartTime } from '../utils/calculateStartTime';

interface UseAudioPlayerArgs {
    previewUrl: string | null;
    startedAt: number | null;
    initialVolume?: number;
}

export const useAudioPlayer = ({ previewUrl, startedAt, initialVolume = 0.1 }: UseAudioPlayerArgs) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [volume, setVolume] = useState(initialVolume);

    useEffect(() => {
        if (audioRef.current && previewUrl && startedAt) {
            const audio = audioRef.current;
            const playbackStartTime = calculateStartTime(startedAt);

            audio.pause();
            audio.src = previewUrl;
            audio.currentTime = playbackStartTime;
            audio.volume = volume;

            audio.play().catch((err) => {
                console.error('Error playing audio', err);
            });
        }
    }, [previewUrl, startedAt]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    return {
        audioRef,
        volume,
        setVolume,
    };
};