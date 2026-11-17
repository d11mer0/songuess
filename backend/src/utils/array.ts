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
    correctTrackTitle?: string,
): string[] {
    const normalizedCorrect = correctTrackTitle?.trim().toLowerCase();
    const seenTitles = new Set<string>(normalizedCorrect ? [normalizedCorrect] : []);

    const available = tracks.filter((t) => {
        if (t.id === correctTrackId) return false;
        const norm = t.title?.trim().toLowerCase();
        return Boolean(norm) && !seenTitles.has(norm);
    });
    if (available.length === 0) return [];

    const shuffled = shuffleArray(available);
    const picked: string[] = [];
    for (const track of shuffled) {
        const norm = track.title.trim().toLowerCase();
        if (seenTitles.has(norm)) continue;
        seenTitles.add(norm);
        picked.push(track.title);
        if (picked.length >= count) break;
    }
    return picked;
}
