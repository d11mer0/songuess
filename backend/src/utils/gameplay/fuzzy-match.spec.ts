import {
    normalizeText,
    levenshteinDistance,
    calculateSimilarity,
    isFuzzyMatch,
} from './fuzzy-match.util';

describe('Fuzzy Match Utilities', () => {
    describe('normalizeText', () => {
        it('should lowercase, strip accents, and remove punctuation', () => {
            expect(normalizeText('Bohemian Rhapsody (Remastered 2011)')).toBe('bohemian rhapsody');
            expect(normalizeText('Yeah! [feat. Lil Jon & Ludacris]')).toBe('yeah');
            expect(normalizeText('Café del Mar - Live Edit')).toBe('cafe del mar');
        });
    });

    describe('levenshteinDistance', () => {
        it('should calculate correct edit distance', () => {
            expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
            expect(levenshteinDistance('queen', 'queen')).toBe(0);
            expect(levenshteinDistance('billie', 'bilie')).toBe(1);
        });
    });

    describe('isFuzzyMatch', () => {
        it('should match exact string', () => {
            const res = isFuzzyMatch('In the End', 'In the End');
            expect(res.isMatch).toBe(true);
            expect(res.similarity).toBe(1);
        });

        it('should match with small typos / misspellings', () => {
            // Typo: "Bohemian Rhaspody" instead of "Bohemian Rhapsody"
            const res = isFuzzyMatch('Bohemian Rhaspody', 'Bohemian Rhapsody (Remastered 2011)');
            expect(res.isMatch).toBe(true);
            expect(res.similarity).toBeGreaterThan(0.8);
        });

        it('should match track with feat or brackets stripped', () => {
            const res = isFuzzyMatch('Numb', 'Numb (Official Audio)');
            expect(res.isMatch).toBe(true);
        });

        it('should recognize artist match when user inputs artist name', () => {
            const res = isFuzzyMatch('Linkin Park', 'In the End', 'Linkin Park');
            expect(res.isArtistMatch).toBe(true);
        });

        it('should not match completely different song', () => {
            const res = isFuzzyMatch('Yesterday', 'Bohemian Rhapsody');
            expect(res.isMatch).toBe(false);
        });
    });
});