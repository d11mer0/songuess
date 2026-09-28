export interface ArtistBioResult {
    title: string;
    extract: string;
    description?: string;
    thumbnail?: string;
    pageUrl?: string;
    lang: 'uk' | 'en';
}

const bioCache = new Map<string, ArtistBioResult | null>();

/**
 * Fetches a concise, reliable artist biography from the free Wikimedia REST API.
 * Automatically tries the current language (e.g. 'uk') and falls back to 'en'.
 */
export async function fetchArtistBio(
    artistName: string,
    preferredLang: 'uk' | 'en' = 'uk'
): Promise<ArtistBioResult | null> {
    const rawName = artistName.trim();
    if (!rawName) return null;

    const cacheKey = `${preferredLang}:${rawName.toLowerCase()}`;
    if (bioCache.has(cacheKey)) {
        return bioCache.get(cacheKey) || null;
    }

    const candidateNames = [
        rawName.replace(/\s+/g, '_'),
        rawName,
    ];

    // Try preferred language
    for (const name of candidateNames) {
        try {
            const url = `https://${preferredLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data && data.extract && data.type !== 'disambiguation') {
                    const result: ArtistBioResult = {
                        title: data.title || rawName,
                        extract: data.extract,
                        description: data.description,
                        thumbnail: data.thumbnail?.source,
                        pageUrl: data.content_urls?.desktop?.page,
                        lang: preferredLang,
                    };
                    bioCache.set(cacheKey, result);
                    return result;
                }
            }
        } catch {
            // continue to fallback
        }
    }

    // If preferred was Ukrainian and not found, try English fallback
    if (preferredLang !== 'en') {
        for (const name of candidateNames) {
            try {
                const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.extract && data.type !== 'disambiguation') {
                        const result: ArtistBioResult = {
                            title: data.title || rawName,
                            extract: data.extract,
                            description: data.description,
                            thumbnail: data.thumbnail?.source,
                            pageUrl: data.content_urls?.desktop?.page,
                            lang: 'en',
                        };
                        bioCache.set(cacheKey, result);
                        return result;
                    }
                }
            } catch {
                // ignore
            }
        }
    }

    bioCache.set(cacheKey, null);
    return null;
}
