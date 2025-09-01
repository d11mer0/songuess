export function calculateScore(
    timeTaken: number,
    isCorrect: boolean,
    isFirst: boolean,
): number {
    if (!isCorrect || timeTaken === null) return 0;

    const rawScore = Math.max(0, 25000 - timeTaken) / 10;
    const normalizedScore = parseFloat((rawScore / 25).toFixed(2));

    let finalScore = normalizedScore + 100;
    if (isFirst) finalScore += 20;

    return parseFloat(finalScore.toFixed(2));
}