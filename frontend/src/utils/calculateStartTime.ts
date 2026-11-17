let serverClockOffsetMs = 0;

export const updateServerClockOffset = (serverTime?: number): void => {
    if (typeof serverTime === 'number' && Number.isFinite(serverTime)) {
        serverClockOffsetMs = serverTime - Date.now();
    }
};

export const getServerNow = (): number => Date.now() + serverClockOffsetMs;

export const calculateStartTime = (startedAt: number, serverTime?: number): number => {
    if (typeof serverTime === 'number' && Number.isFinite(serverTime)) {
        updateServerClockOffset(serverTime);
    }
    const now = getServerNow();
    const startedAtMs = new Date(startedAt).getTime();
    let secondsPassed = (now - startedAtMs) / 1000;
    if (secondsPassed > 1) secondsPassed -= 0.1;
    return Math.max(0, Math.min(secondsPassed, 29.9));
};
