import {
    filterTracks,
    filterTracksByArtist,
    normalizeTitle,
    cleanTrackTitle,
    getTrackQualityScore,
} from './track-utils';

describe('Track Utils - Deezer Track Filtering & Smart Deduplication', () => {
    const nonOriginalKeywords = [
        'live',
        'remix',
        'mixed',
        'extended',
        'version',
        'edition',
        'edit',
        'bonus',
        'feat',
    ];

    describe('normalizeTitle', () => {
        it('should lowercase and trim string', () => {
            expect(normalizeTitle('  Hello World  ')).toBe('hello world');
        });

        it('should normalize fancy single quotes to standard quotes', () => {
            expect(normalizeTitle('Don’t Stop Believin’')).toBe("don't stop believin'");
        });
    });

    describe('cleanTrackTitle', () => {
        it('should strip feat tags in parentheses and brackets', () => {
            expect(cleanTrackTitle('Levitating (feat. DaBaby)')).toBe('levitating');
            expect(cleanTrackTitle('Levitating [feat. DaBaby]')).toBe('levitating');
            expect(cleanTrackTitle('Cold Heart - PNAU Remix')).toBe('cold heart');
        });

        it('should strip remasters, editions, reissues and live tags', () => {
            expect(cleanTrackTitle('In the End - 2020 Remaster')).toBe('in the end');
            expect(cleanTrackTitle('In the End (Live at Milton Keynes)')).toBe('in the end');
            expect(cleanTrackTitle('Sweet Child O’ Mine (Remastered 2018)')).toBe('sweet child o mine');
            expect(cleanTrackTitle('Around the World (Radio Edit)')).toBe('around the world');
        });
    });

    describe('getTrackQualityScore', () => {
        it('should give highest score to clean studio album tracks with high popularity rank', () => {
            const studioTrack = {
                title: 'Levitating',
                preview: 'https://preview.mp3',
                rank: 900000,
                record_type: 'album',
                release_date: '2020-03-27',
                album: { title: 'Future Nostalgia' },
            };
            const liveTrack = {
                title: 'Levitating (Live from Royal Albert Hall)',
                preview: 'https://preview.mp3',
                rank: 450000,
                record_type: 'album',
                release_date: '2024-12-06',
                album: { title: 'Live Album' },
            };

            const studioScore = getTrackQualityScore(studioTrack);
            const liveScore = getTrackQualityScore(liveTrack);

            expect(studioScore).toBeGreaterThan(liveScore);
            expect(studioScore).toBeGreaterThan(150);
            expect(liveScore).toBeLessThan(0);
        });

        it('should return very negative score for missing previews or karaoke/instrumentals', () => {
            expect(getTrackQualityScore({ title: 'Song', preview: '' })).toBeLessThan(-1000);
            expect(
                getTrackQualityScore({
                    title: 'Song (Karaoke Version)',
                    preview: 'https://preview.mp3',
                }),
            ).toBeLessThan(-300);
            expect(
                getTrackQualityScore({
                    title: 'Song - Commentary',
                    preview: 'https://preview.mp3',
                }),
            ).toBeLessThan(-300);
        });
    });

    describe('filterTracks', () => {
        it('should filter out tracks without preview or with empty preview', () => {
            const tracks = [
                { id: 1, title: 'Valid Track', preview: 'https://preview.mp3' },
                { id: 2, title: 'No Preview', preview: '' },
                { id: 3, title: 'Undefined Preview' },
                { id: 4, title: 'Another Valid', preview: 'https://preview2.mp3' },
            ];

            const filtered = filterTracks(tracks);
            expect(filtered).toHaveLength(2);
            expect(filtered.map((t) => t.id)).toEqual([1, 4]);
        });
    });

    describe('filterTracksByArtist', () => {
        it('should remove tracks matching non-original keywords (live, remix, edit)', () => {
            const artist = { id: 100, name: 'Daft Punk' };
            const tracks = [
                {
                    id: 1,
                    title: 'One More Time',
                    artist,
                    release_date: '2001-01-01',
                    preview: 'url1',
                },
                {
                    id: 2,
                    title: 'One More Time (Live)',
                    artist,
                    release_date: '2007-01-01',
                    preview: 'url2',
                },
                {
                    id: 3,
                    title: 'One More Time (Club Remix)',
                    artist,
                    release_date: '2001-05-01',
                    preview: 'url3',
                },
                {
                    id: 4,
                    title: 'Around the World',
                    artist,
                    release_date: '1997-01-01',
                    preview: 'url4',
                },
                {
                    id: 5,
                    title: 'Around the World (Radio Edit)',
                    artist,
                    release_date: '1997-02-01',
                    preview: 'url5',
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(2);
            expect(result.map((t) => t.id)).toEqual([4, 1]);
        });

        it('should filter out tracks without preview', () => {
            const artist = { id: 200, name: 'Queen' };
            const tracks = [
                {
                    id: 10,
                    title: 'Bohemian Rhapsody',
                    artist,
                    release_date: '1975-10-31',
                    preview: '',
                },
                {
                    id: 11,
                    title: 'Radio Ga Ga',
                    artist,
                    release_date: '1984-01-23',
                    preview: 'url',
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(11);
        });

        it('should deduplicate album vs single versions and prefer best studio track', () => {
            const artist = { id: 300, name: 'Dua Lipa' };
            const tracks = [
                {
                    id: 101,
                    title: 'Levitating',
                    artist,
                    preview: 'url-studio',
                    rank: 900000,
                    record_type: 'album',
                    release_date: '2020-03-27',
                },
                {
                    id: 102,
                    title: 'Levitating (feat. DaBaby)',
                    artist,
                    preview: 'url-single',
                    rank: 750000,
                    record_type: 'single',
                    release_date: '2020-10-02',
                },
                {
                    id: 103,
                    title: 'Levitating (Live From Mexico)',
                    artist,
                    preview: 'url-live',
                    rank: 450000,
                    record_type: 'album',
                    release_date: '2026-05-22',
                },
                {
                    id: 201,
                    title: 'Dance The Night',
                    artist,
                    preview: 'url-barbie',
                    rank: 820000,
                    record_type: 'single',
                    release_date: '2023-05-25',
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(2);
            // Must keep id 101 ('Levitating' original) and id 201 ('Dance The Night' standalone single)
            expect(result.map((t) => t.id)).toEqual([101, 201]);
        });

        it('should deduplicate identical tracks by ISRC', () => {
            const artist = { id: 400, name: 'Linkin Park' };
            const tracks = [
                {
                    id: 501,
                    title: 'In the End',
                    artist,
                    preview: 'url-1',
                    isrc: 'USWB10000123',
                    rank: 800000,
                    record_type: 'album',
                    release_date: '2000-10-24',
                },
                {
                    id: 502,
                    title: 'In the End - 20th Anniversary Edition',
                    artist,
                    preview: 'url-2',
                    isrc: 'USWB10000123', // Same ISRC!
                    rank: 400000,
                    record_type: 'album',
                    release_date: '2020-10-09',
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(501);
        });

        it('should filter out pure karaoke and commentary audio tracks', () => {
            const artist = { id: 500, name: 'Eminem' };
            const tracks = [
                {
                    id: 601,
                    title: 'Lose Yourself',
                    artist,
                    preview: 'url-real',
                    rank: 950000,
                    release_date: '2002-10-28',
                },
                {
                    id: 602,
                    title: 'Public Service Announcement - Commentary',
                    artist,
                    preview: 'url-skit',
                    release_date: '1999-02-23',
                },
                {
                    id: 603,
                    title: 'Lose Yourself (Karaoke Backing Track)',
                    artist,
                    preview: 'url-karaoke',
                    release_date: '2003-01-01',
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(601);
        });
    });
});
