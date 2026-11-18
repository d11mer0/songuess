import { GameMode } from '../../game/interfaces/game.interface';

export const VALID_HEARDLE_TIERS = [1, 2, 5, 10, 20] as const;

export function inferMinHeardleTierFromElapsed(timeTakenMs: number): number {
    if (!Number.isFinite(timeTakenMs) || timeTakenMs <= 6000) return 1;
    if (timeTakenMs <= 8000) return 2;
    if (timeTakenMs <= 12000) return 5;
    if (timeTakenMs <= 18000) return 10;
    return 20;
}

export function resolveEffectiveHeardleDuration(
    snippetDurationUsed: number | undefined,
    timeTakenMs: number,
): number {
    const minTierByTime = inferMinHeardleTierFromElapsed(timeTakenMs);

    if (
        typeof snippetDurationUsed === 'number' &&
        Number.isFinite(snippetDurationUsed) &&
        snippetDurationUsed >= 1
    ) {
        return Math.max(snippetDurationUsed, minTierByTime);
    }

    if (snippetDurationUsed !== undefined) {
        // Spoofed/invalid snippet values (0, negative, NaN) never receive 1s bonus
        return 20;
    }

    const elapsedSec = Math.max(1, timeTakenMs / 1000);
    const fallbackTier = elapsedSec <= 2 ? 2 : elapsedSec <= 5 ? 5 : elapsedSec <= 10 ? 10 : 20;
    return Math.max(fallbackTier, minTierByTime);
}

export function calculateScore(
    timeTaken: number,
    isCorrect: boolean,
    isFirst: boolean,
    gameMode: GameMode = 'CLASSIC',
    snippetDurationUsed?: number,
    roundDurationMs: number = 25000,
): number {
    if (!isCorrect || timeTaken === null) return 0;

    const safeDuration = roundDurationMs > 0 ? roundDurationMs : 25000;
    const timeRatio = Math.max(0, (safeDuration - timeTaken) / safeDuration);

    // Режим Бліц-Дуель 1v1: Бали забирає виключно перший гравець, що дав правильну відповідь!
    if (gameMode === 'DUEL') {
        if (!isFirst) return 0;
        const timeBonus = Math.floor(timeRatio * 100);
        return 150 + timeBonus;
    }

    // Режим Heardle (Прогресивне відгадування): бали залежать від тривалості відкритого фрагменту
    if (gameMode === 'HEARDLE') {
        let basePoints = 100;
        const duration = resolveEffectiveHeardleDuration(snippetDurationUsed, timeTaken);

        if (duration <= 1) {
            basePoints = 500;
        } else if (duration <= 2) {
            basePoints = 400;
        } else if (duration <= 5) {
            basePoints = 300;
        } else if (duration <= 10) {
            basePoints = 200;
        } else {
            basePoints = 100;
        }

        const timeBonus = Math.floor(timeRatio * 50);
        let score = basePoints + timeBonus;
        if (isFirst) score += 25;
        return score;
    }

    // Класичний режим: залежність від швидкості реакції
    const normalizedScore = parseFloat((timeRatio * 100).toFixed(2));

    let finalScore = normalizedScore + 100;
    if (isFirst) finalScore += 20;

    return parseFloat(finalScore.toFixed(2));
}