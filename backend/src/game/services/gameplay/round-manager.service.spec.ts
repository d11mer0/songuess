import { RoundManagerService } from './round-manager.service';
import { ScoringService } from './scoring.service';
import { GameResultService } from './game-result.service';
import { GameEventsService } from './game-events.service';

describe('RoundManagerService - Round Generation & Timers', () => {
    let service: RoundManagerService;

    const mockScoring = {} as unknown as ScoringService;
    const mockGameResult = {} as unknown as GameResultService;
    const mockGameEvents = {} as unknown as GameEventsService;

    const sampleTracks = [
        { id: 1, title: 'Track 1', preview: 'https://preview.com/1.mp3', artist: { name: 'Artist 1' } },
        { id: 2, title: 'Track 2', preview: 'https://preview.com/2.mp3', artist: { name: 'Artist 2' } },
        { id: 3, title: 'Track 3', preview: 'https://preview.com/3.mp3', artist: { name: 'Artist 3' } },
        { id: 4, title: 'Track 4', preview: 'https://preview.com/4.mp3', artist: { name: 'Artist 4' } },
        { id: 5, title: 'Track 5', preview: 'https://preview.com/5.mp3', artist: { name: 'Artist 5' } },
    ];

    beforeEach(() => {
        service = new RoundManagerService(mockScoring, mockGameResult, mockGameEvents);
    });

    it('should throw an error if tracks count is less than 3', () => {
        const fewTracks = [
            { id: 1, title: 'Track 1', preview: 'url' },
            { id: 2, title: 'Track 2', preview: 'url' },
        ];
        expect(() => service.generateGameRounds(fewTracks, 5)).toThrow('Not enough tracks to generate round options');
    });

    it('should generate the requested number of rounds when enough tracks exist', () => {
        const rounds = service.generateGameRounds(sampleTracks, 3);
        expect(rounds).toHaveLength(3);
        rounds.forEach((round, i) => {
            expect(round.roundNumber).toBe(i);
            expect(round.track).toBeDefined();
            expect(round.track.preview).toBeDefined();
            expect(round.options).toHaveLength(4);
            expect(round.options).toContain(round.track.title);
        });
    });

    it('should cap rounds to track count if roundsCount exceeds tracks', () => {
        const rounds = service.generateGameRounds(sampleTracks, 10);
        expect(rounds).toHaveLength(5);
    });
});
