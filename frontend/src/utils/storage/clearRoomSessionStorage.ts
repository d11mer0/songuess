export function clearRoomSessionStorage(roomId?: string | null) {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    const prefixes = roomId
        ? [`songuess_heardle_${roomId}_`, `songuess_answered_${roomId}_`]
        : ['songuess_heardle_', 'songuess_answered_'];

    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && prefixes.some((p) => key.startsWith(p))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
}
