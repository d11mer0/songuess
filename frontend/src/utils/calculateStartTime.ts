export const calculateStartTime = (startedAt: number): number => {
    const now = Date.now();
    const startedAtMs = new Date(startedAt).getTime();
    let secondsPassed = (now - startedAtMs) / 1000;
    if (secondsPassed > 1) secondsPassed -= 0.1;
    return Math.min(secondsPassed, 29.9);
};