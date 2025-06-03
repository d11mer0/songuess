import { TrackItem } from '../game/interfaces/tracks.interface';

export function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function pickRandomWrongOptions(
    tracks: TrackItem[],
    correctTrackId: string,
    count: number = 3,
): string[] {
    const available = tracks.filter((t) => t.id !== correctTrackId);

    for (let i = available.length - 1; i > available.length - 1 - count; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }

    return available.slice(-count).map((t) => t.title);
}
