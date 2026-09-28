/**
 * Formats ISO date string (e.g. "2018-10-25") into human-friendly localized dates:
 * - Ukrainian: "25 жовтня 2018"
 * - English: "October 25, 2018"
 */
export function formatReleaseDate(dateStr?: string, lang: 'uk' | 'en' = 'uk'): string {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();

    // If only a 4-digit year was provided
    if (/^\d{4}$/.test(trimmed)) {
        return trimmed;
    }

    try {
        const date = new Date(trimmed);
        if (isNaN(date.getTime())) return trimmed;

        if (lang === 'uk') {
            const formatted = new Intl.DateTimeFormat('uk-UA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(date);
            // Remove trailing " р." or " р" for a cleaner look
            return formatted.replace(/\s*р\.?$/, '');
        } else {
            return new Intl.DateTimeFormat('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(date);
        }
    } catch {
        return trimmed;
    }
}
