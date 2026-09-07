import { filterTracks, filterTracksByArtist, normalizeTitle } from './track-utils';

describe('Track Utils - Deezer Track Filtering', () => {
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
            expect(filtered.map(t => t.id)).toEqual([1, 4]);
        });
    });

    describe('filterTracksByArtist', () => {
        it('should remove tracks matching non-original keywords (live, remix, edit)', () => {
            const artist = { id: 100, name: 'Daft Punk' };
            const tracks = [
                { id: 1, title: 'One More Time', artist, release_date: '2001-01-01', preview: 'url1' },
                { id: 2, title: 'One More Time (Live)', artist, release_date: '2007-01-01', preview: 'url2' },
                { id: 3, title: 'One More Time (Club Remix)', artist, release_date: '2001-05-01', preview: 'url3' },
                { id: 4, title: 'Around the World', artist, release_date: '1997-01-01', preview: 'url4' },
                { id: 5, title: 'Around the World (Radio Edit)', artist, release_date: '1997-02-01', preview: 'url5' },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(2);
            expect(result.map(t => t.id)).toEqual([4, 1]);
        });

        it('should filter out tracks without preview', () => {
            const artist = { id: 200, name: 'Queen' };
            const tracks = [
                { id: 10, title: 'Bohemian Rhapsody', artist, release_date: '1975-10-31', preview: '' },
                { id: 11, title: 'Radio Ga Ga', artist, release_date: '1984-01-23', preview: 'url' },
            ];

            const result = filterTracksByArtist(tracks, nonOriginalKeywords);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(11);
        });
    });
});