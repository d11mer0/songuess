import { pickRandomWrongOptions } from '../../../utils/array';
import { formatRoundPayload } from '../../../utils/gameplay/payload.util';

describe('Batch 3 Unit Fixes (BUG-18, BUG-26)', () => {
    it('formatRoundPayload includes serverTime for clock skew adjustment (BUG-18)', () => {
        const before = Date.now();
        const payload = formatRoundPayload(
            {
                roundNumber: 0,
                track: { id: '1', title: 'Song', preview: 'https://p/1.mp3' },
                options: ['Song', 'A', 'B', 'C'],
                startedAt: before - 1000,
            },
            15000,
        );
        const after = Date.now();
        expect(payload.serverTime).toBeGreaterThanOrEqual(before);
        expect(payload.serverTime).toBeLessThanOrEqual(after);
        expect(payload.endsAt).toBe(before - 1000 + 15000);
    });

    it('pickRandomWrongOptions deduplicates duplicate titles and excludes correct title (BUG-26)', () => {
        const tracks = [
            { id: '1', title: 'Hello', preview: 'p1' },
            { id: '2', title: 'Hello', preview: 'p2' },
            { id: '3', title: 'World', preview: 'p3' },
            { id: '4', title: 'world', preview: 'p4' },
            { id: '5', title: 'Alpha', preview: 'p5' },
            { id: '6', title: 'Beta', preview: 'p6' },
        ];
        const wrong = pickRandomWrongOptions(tracks, '1', 3, 'Hello');
        expect(wrong).toHaveLength(3);
        const lower = wrong.map((t) => t.toLowerCase());
        expect(lower).not.toContain('hello');
        expect(new Set(lower).size).toBe(3);
    });
});
