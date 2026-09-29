import {
    filterTracks,
    filterTracksByArtist,
    normalizeTitle,
    cleanTrackTitle,
    getTrackQualityScore,
    isValidPreviewUrl,
    isPlayableTrack,
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

    describe('isValidPreviewUrl & isPlayableTrack', () => {
        it('should correctly identify valid preview audio URLs', () => {
            expect(isValidPreviewUrl('https://cdns-preview-d.dzcdn.net/stream/123.mp3')).toBe(true);
            expect(isValidPreviewUrl('http://cdns-preview-d.dzcdn.net/stream/123.mp3')).toBe(true);
            expect(isValidPreviewUrl('')).toBe(false);
            expect(isValidPreviewUrl('   ')).toBe(false);
            expect(isValidPreviewUrl(null)).toBe(false);
            expect(isValidPreviewUrl(undefined)).toBe(false);
            expect(isValidPreviewUrl('ftp://invalid')).toBe(false);
            expect(isValidPreviewUrl('short')).toBe(false);
        });

        it('should reject unplayable tracks or tracks with readable === false', () => {
            expect(isPlayableTrack({ title: 'Song', preview: 'https://preview.mp3' })).toBe(true);
            expect(isPlayableTrack({ title: 'Song', preview: 'https://preview.mp3', readable: false })).toBe(false);
            expect(isPlayableTrack({ title: 'Song', preview: '' })).toBe(false);
            expect(isPlayableTrack(null)).toBe(false);
        });
    });

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

        it('should prioritize title_short from Deezer when available', () => {
            expect(cleanTrackTitle('In the End (One More Light Live)', 'In the End')).toBe('in the end');
            expect(cleanTrackTitle('The Unforgiven (Remastered 2021)', 'The Unforgiven')).toBe('the unforgiven');
        });

        it('should preserve distinct song sequel numbers and parts', () => {
            expect(cleanTrackTitle('The Unforgiven II', 'The Unforgiven II')).toBe('the unforgiven ii');
            expect(cleanTrackTitle('The Unforgiven III', 'The Unforgiven III')).toBe('the unforgiven iii');
            expect(cleanTrackTitle('Part 1')).toBe('part 1');
            expect(cleanTrackTitle('Part 2')).toBe('part 2');
        });

        it('should normalize accented letters (NFD) without losing meaning', () => {
            expect(cleanTrackTitle('Déjà Vu')).toBe('deja vu');
            expect(cleanTrackTitle('Café del Mar')).toBe('cafe del mar');
        });

        it('should preserve Ukrainian Cyrillic characters properly', () => {
            expect(cleanTrackTitle('Без бою')).toBe('без бою');
            expect(cleanTrackTitle('Спи собі сама')).toBe('спи собі сама');
            expect(cleanTrackTitle('Червона Рута')).toBe('червона рута');
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

        it('should penalize ultra-short non-song audio skits/intros (< 25s)', () => {
            const skit = {
                title: 'Intro',
                duration: 18,
                preview: 'https://preview.mp3',
            };
            expect(getTrackQualityScore(skit)).toBeLessThan(-300);
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
        it('should filter out tracks without preview or with empty preview or unreadable', () => {
            const tracks = [
                { id: 1, title: 'Valid Track', preview: 'https://preview.mp3' },
                { id: 2, title: 'No Preview', preview: '' },
                { id: 3, title: 'Undefined Preview' },
                { id: 4, title: 'Another Valid', preview: 'https://preview2.mp3' },
                { id: 5, title: 'Geo-blocked', preview: 'https://preview3.mp3', readable: false },
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
                    title_short: 'One More Time',
                    artist,
                    release_date: '2001-01-01',
                    preview: 'https://preview.mp3/1',
                },
                {
                    id: 2,
                    title: 'One More Time (Live)',
                    title_short: 'One More Time',
                    artist,
                    release_date: '2007-01-01',
                    preview: 'https://preview.mp3/2',
                },
                {
                    id: 3,
                    title: 'One More Time (Club Remix)',
                    title_short: 'One More Time',
                    artist,
                    release_date: '2001-05-01',
                    preview: 'https://preview.mp3/3',
                },
                {
                    id: 4,
                    title: 'Around the World',
                    title_short: 'Around the World',
                    artist,
                    release_date: '1997-01-01',
                    preview: 'https://preview.mp3/4',
                },
                {
                    id: 5,
                    title: 'Around the World (Radio Edit)',
                    title_short: 'Around the World',
                    artist,
                    release_date: '1997-02-01',
                    preview: 'https://preview.mp3/5',
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(2);
            expect(result.map((t) => t.id)).toEqual([4, 1]);
        });

        it('should preserve live-only songs when no studio version exists', () => {
            const artist = { id: 150, name: 'Nirvana' };
            const tracks = [
                {
                    id: 50,
                    title: 'Where Did You Sleep Last Night (Live)',
                    title_short: 'Where Did You Sleep Last Night',
                    artist,
                    release_date: '1994-11-01',
                    preview: 'https://preview.mp3/50',
                    rank: 600000,
                    duration: 300,
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(50);
        });

        it('should preserve distinct songs that share prefix like Part 1 and Part 2', () => {
            const artist = { id: 250, name: 'Pink Floyd' };
            const tracks = [
                {
                    id: 61,
                    title: 'Another Brick in the Wall, Pt. 1',
                    title_short: 'Another Brick in the Wall, Pt. 1',
                    artist,
                    release_date: '1979-11-30',
                    preview: 'https://preview.mp3/61',
                    rank: 500000,
                    duration: 190,
                },
                {
                    id: 62,
                    title: 'Another Brick in the Wall, Pt. 2',
                    title_short: 'Another Brick in the Wall, Pt. 2',
                    artist,
                    release_date: '1979-11-30',
                    preview: 'https://preview.mp3/62',
                    rank: 950000,
                    duration: 239,
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(2);
            expect(result.map((t) => t.id)).toEqual([61, 62]);
        });

        it('should deduplicate album vs single versions and prefer best studio track', () => {
            const artist = { id: 300, name: 'Dua Lipa' };
            const tracks = [
                {
                    id: 101,
                    title: 'Levitating',
                    title_short: 'Levitating',
                    artist,
                    preview: 'https://preview.mp3/101',
                    rank: 900000,
                    record_type: 'album',
                    release_date: '2020-03-27',
                },
                {
                    id: 102,
                    title: 'Levitating (feat. DaBaby)',
                    title_short: 'Levitating',
                    artist,
                    preview: 'https://preview.mp3/102',
                    rank: 750000,
                    record_type: 'single',
                    release_date: '2020-10-02',
                },
                {
                    id: 103,
                    title: 'Levitating (Live From Mexico)',
                    title_short: 'Levitating',
                    artist,
                    preview: 'https://preview.mp3/103',
                    rank: 450000,
                    record_type: 'album',
                    release_date: '2026-05-22',
                },
                {
                    id: 201,
                    title: 'Dance The Night',
                    title_short: 'Dance The Night',
                    artist,
                    preview: 'https://preview.mp3/201',
                    rank: 820000,
                    record_type: 'single',
                    release_date: '2023-05-25',
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(2);
            expect(result.map((t) => t.id)).toEqual([101, 201]);
        });

        it('should deduplicate identical tracks by ISRC', () => {
            const artist = { id: 400, name: 'Linkin Park' };
            const tracks = [
                {
                    id: 501,
                    title: 'In the End',
                    artist,
                    preview: 'https://preview.mp3/501',
                    isrc: 'USWB10000123',
                    rank: 800000,
                    record_type: 'album',
                    release_date: '2000-10-24',
                },
                {
                    id: 502,
                    title: 'In the End - 20th Anniversary Edition',
                    artist,
                    preview: 'https://preview.mp3/502',
                    isrc: 'USWB10000123',
                    rank: 400000,
                    record_type: 'album',
                    release_date: '2020-10-09',
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(501);
        });

        it('should filter out pure karaoke, commentary, and skits', () => {
            const artist = { id: 500, name: 'Eminem' };
            const tracks = [
                {
                    id: 601,
                    title: 'Lose Yourself',
                    artist,
                    preview: 'https://preview.mp3/601',
                    rank: 950000,
                    release_date: '2002-10-28',
                    duration: 320,
                },
                {
                    id: 602,
                    title: 'Public Service Announcement - Commentary',
                    artist,
                    preview: 'https://preview.mp3/602',
                    release_date: '1999-02-23',
                    duration: 35,
                },
                {
                    id: 603,
                    title: 'Lose Yourself (Karaoke Backing Track)',
                    artist,
                    preview: 'https://preview.mp3/603',
                    release_date: '2003-01-01',
                    duration: 320,
                },
                {
                    id: 604,
                    title: 'Curtain Call Intro',
                    artist,
                    preview: 'https://preview.mp3/604',
                    release_date: '2005-12-06',
                    duration: 15,
                },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(601);
        });
    });
});
