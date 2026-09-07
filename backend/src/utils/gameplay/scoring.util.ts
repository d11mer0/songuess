import { GameMode } from '../../game/interfaces/game.interface';

export function calculateScore(
    timeTaken: number,
    isCorrect: boolean,
    isFirst: boolean,
    gameMode: GameMode = 'CLASSIC',
    snippetDurationUsed?: number,
): number {
    if (!isCorrect || timeTaken === null) return 0;

    // Режим Бліц-Дуель 1v1: Бали забирає виключно перший гравець, що дав правильну відповідь!
    if (gameMode === 'DUEL') {
        if (!isFirst) return 0;
        const timeBonus = Math.max(0, Math.floor((25000 - timeTaken) / 250));
        return 150 + timeBonus;
    }

    // Режим Heardle (Прогресивне відгадування): бали залежать від тривалості відкритого фрагменту
    if (gameMode === 'HEARDLE') {
        let basePoints = 100;
        const duration = snippetDurationUsed || 1;

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

        const timeBonus = Math.max(0, Math.floor((25000 - timeTaken) / 500));
        let score = basePoints + timeBonus;
        if (isFirst) score += 25;
        return score;
    }

    // Класичний режим: залежність від швидкості реакції
    const rawScore = Math.max(0, 25000 - timeTaken) / 10;
    const normalizedScore = parseFloat((rawScore / 25).toFixed(2));

    let finalScore = normalizedScore + 100;
    if (isFirst) finalScore += 20;

    return parseFloat(finalScore.toFixed(2));
}