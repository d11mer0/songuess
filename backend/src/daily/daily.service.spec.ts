import { DailyService } from './daily.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DailyService - Daily Challenge', () => {
    let service: DailyService;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            dailyResult: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
        };
        service = new DailyService(mockPrisma as PrismaService);
    });

    it('should calculate deterministic day number and return track', () => {
        const day1 = service.getDayNumber();
        expect(day1).toBeGreaterThan(0);

        const track = service.getTodayTrack(day1);
        expect(track).toBeDefined();
        expect(track.title).toBeDefined();
        expect(track.preview).toBeDefined();
    });

    it('should mask track details if challenge is not completed yet', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            dailyStreak: 2,
            maxDailyStreak: 5,
            dailyResults: [],
        });

        const challenge = await service.getDailyChallenge(1);
        expect(challenge.isCompleted).toBe(false);
        expect(challenge.track).toBeNull(); // Masked!
        expect(challenge.shareText).toBeNull();
        expect(challenge.preview).toBeDefined();
    });

    it('should reveal track details and share text when challenge is completed', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            dailyStreak: 3,
            maxDailyStreak: 5,
            dailyResults: [
                {
                    isSolved: true,
                    guessesCount: 2,
                },
            ],
        });

        const challenge = await service.getDailyChallenge(1);
        expect(challenge.isCompleted).toBe(true);
        expect(challenge.isSolved).toBe(true);
        expect(challenge.track).not.toBeNull();
        expect(challenge.shareText).toContain('🟩');
    });

    it('should correctly validate guess, increment streak and generate share card', async () => {
        const day = service.getDayNumber();
        const expectedTrack = service.getTodayTrack(day);

        mockPrisma.dailyResult.findUnique.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            dailyStreak: 4,
            maxDailyStreak: 4,
            lastDailyDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        mockPrisma.dailyResult.create.mockResolvedValue({});
        mockPrisma.user.update.mockResolvedValue({});

        const result = await service.submitGuess(1, expectedTrack.title, 1);
        expect(result.isCorrect).toBe(true);
        expect(result.isGameOver).toBe(true);
        expect(result.streak).toBe(5);
        expect(result.shareText).toContain('SonGuess Daily #');
        expect(result.shareText).toContain('🟩');
    });

    it('should reset streak on 6th failed attempt', async () => {
        mockPrisma.dailyResult.findUnique.mockResolvedValue(null);
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            dailyStreak: 5,
            maxDailyStreak: 5,
        });
        mockPrisma.dailyResult.create.mockResolvedValue({});
        mockPrisma.user.update.mockResolvedValue({});

        const result = await service.submitGuess(1, 'Completely Wrong Song', 6);
        expect(result.isCorrect).toBe(false);
        expect(result.isGameOver).toBe(true);
        expect(result.streak).toBe(0);
        expect(result.shareText).toContain('🟥');
    });
});