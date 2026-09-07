/**
 * Утиліти для нечіткого порівняння назв треків та виконавців (Fuzzy Match / Levenshtein Distance).
 */

/**
 * Нормалізація тексту: приведення до нижнього регістру, видалення дужок,
 * службових слів (feat, remix, live тощо) та розділових знаків.
 */
export function normalizeText(text: string): string {
    if (!text) return '';

    let cleaned = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    // Видаляємо дужки з метаданими. Якщо за межами дужок залишається текст, видаляємо дужки
    const withoutParens = cleaned.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/-(?:\s*.*)/g, '');
    if (withoutParens.trim().length > 0) {
        cleaned = withoutParens;
    }

    // Замінюємо амперсанд на 'and'
    cleaned = cleaned.replace(/&/g, 'and');

    // Видаляємо всі розділові знаки і спецсимволи
    cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"'\’\‘]/g, ' ');

    // Схлопуємо пробіли
    return cleaned.replace(/\s+/g, ' ').trim();
}

export function levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const row: number[] = [];
    for (let j = 0; j <= b.length; j++) {
        row[j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        let prev = i;
        for (let j = 1; j <= b.length; j++) {
            let val: number;
            if (a[i - 1] === b[j - 1]) {
                val = row[j - 1];
            } else {
                val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
            }
            row[j - 1] = prev;
            prev = val;
        }
        row[b.length] = prev;
    }

    return row[b.length];
}

export function calculateSimilarity(a: string, b: string): number {
    const normA = normalizeText(a);
    const normB = normalizeText(b);

    if (normA === normB) return 1;
    const maxLen = Math.max(normA.length, normB.length);
    if (maxLen === 0) return 1;

    const distance = levenshteinDistance(normA, normB);
    return Math.max(0, 1 - distance / maxLen);
}

export interface MatchResult {
    isMatch: boolean;
    similarity: number;
    isArtistMatch?: boolean;
}

export function isFuzzyMatch(
    userAnswer: string,
    targetTitle: string,
    targetArtist?: string,
): MatchResult {
    const normUser = normalizeText(userAnswer);
    const normTitle = normalizeText(targetTitle);

    if (!normUser || !normTitle) {
        return { isMatch: false, similarity: 0 };
    }

    if (normUser === normTitle) {
        return { isMatch: true, similarity: 1 };
    }

    const distance = levenshteinDistance(normUser, normTitle);
    const maxLen = Math.max(normUser.length, normTitle.length);
    const similarity = Math.max(0, 1 - distance / maxLen);

    let isMatch = false;
    if (normTitle.length <= 4) {
        isMatch = distance <= 1;
    } else if (normTitle.length <= 8) {
        isMatch = distance <= 2 || similarity >= 0.75;
    } else {
        isMatch = similarity >= 0.78;
    }

    if (!isMatch && normTitle.length >= 6 && normUser.length >= 5) {
        if (normTitle.includes(normUser) || normUser.includes(normTitle)) {
            isMatch = true;
        }
    }

    let isArtistMatch = false;
    if (targetArtist) {
        const normArtist = normalizeText(targetArtist);
        if (normArtist && (normUser === normArtist || calculateSimilarity(normUser, normArtist) >= 0.8)) {
            isArtistMatch = true;
        }
    }

    return {
        isMatch,
        similarity: parseFloat(similarity.toFixed(2)),
        isArtistMatch,
    };
}