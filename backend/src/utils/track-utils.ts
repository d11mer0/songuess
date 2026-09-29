export function normalizeTitle(title: string): string {
    return (title || '')
        .trim()
        .toLowerCase()
        .replace(/[\u2018\u2019\u201A\u201B`´]/g, "'");
}

export function isValidPreviewUrl(url: any): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed.length < 10) return false;
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function isPlayableTrack(track: any): boolean {
    if (!track) return false;
    if (track.readable === false) return false;
    return isValidPreviewUrl(track.preview);
}

export function filterTracks(tracks: any[]): any[] {
    if (!Array.isArray(tracks)) return [];
    return tracks.filter(isPlayableTrack);
}

export function cleanTrackTitle(title: string, titleShort?: string): string {
    const base = titleShort && titleShort.trim().length > 0 ? titleShort : title;
    if (!base) return '';

    // Normalize accents (e.g. Déjà Vu -> Deja Vu)
    let t = base
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    t = t.replace(/[\u2018\u2019\u201A\u201B`´]/g, "'");
    t = t.replace(/[\u2013\u2014]/g, '-');

    // 1. Parenthesized / Bracketed non-original, version or feature tags
    t = t.replace(/\s*[\(\[](feat|ft|featuring|with)\.?\s+[^\)\]]+[\)\]]/gi, '');
    t = t.replace(
        /\s*[\(\[][^\)\]]*(remaster|anniversary|deluxe|edition|reissue|mono|stereo|bonus|expanded|drumless|expanded edition)[^\)\]]*[\)\]]/gi,
        '',
    );
    t = t.replace(
        /\s*[\(\[][^\)\]]*(live|concert|tour|unplugged|bbc|mtv|session|acoustic|orchestral)[^\)\]]*[\)\]]/gi,
        '',
    );
    t = t.replace(
        /\s*[\(\[][^\)\]]*(remix|mix|mixed|dub|radio edit|club mix|extended|version|single version|album version|original mix|short edit|edit|clean version|explicit version)[^\)\]]*[\)\]]/gi,
        '',
    );

    // 2. Trailing hyphenated tags: - Live..., - Remaster..., - PNAU Remix..., - Radio Edit...
    t = t.replace(/\s*-\s*(feat|ft|featuring|with)\.?\s+.+$/gi, '');
    t = t.replace(
        /\s*-\s*.*?(remaster|anniversary|live|concert|tour|remix|mix|radio edit|single version|album version|bonus track|acoustic|mono|stereo|deluxe|edit|version|drumless|\d{4}\s*remaster).*$/gi,
        '',
    );

    // 3. Punctuation & extra whitespace cleanup (preserve letters, digits, and Cyrillic)
    t = t.replace(/[^\w\s\u0400-\u04FF]/gi, '');
    t = t.replace(/\s+/g, ' ').trim();

    return (
        t ||
        normalizeTitle(title).replace(/[^\w\s\u0400-\u04FF]/gi, '').trim() ||
        title.trim().toLowerCase()
    );
}

export function getTrackQualityScore(track: any): number {
    if (!isPlayableTrack(track)) return -10000;
    let score = 0;
    const title = (track.title || '').toLowerCase();
    const titleVersion = (track.title_version || '').toLowerCase();
    const fullTitle = `${title} ${titleVersion}`.trim();
    const albumTitle = (track.album?.title || '').toLowerCase();

    // 1. Base score from Deezer popularity rank (0 - 100)
    if (typeof track.rank === 'number' && track.rank > 0) {
        score += Math.min(100, Math.floor(track.rank / 10000));
    }

    // 2. Duration checks: penalize short skits, interludes, intros (< 25s)
    if (typeof track.duration === 'number' && track.duration > 0) {
        if (track.duration < 25) {
            score -= 450;
        } else if (track.duration < 45 && /intro|outro|skit|interlude|speech|snippet/i.test(fullTitle)) {
            score -= 400;
        }
    }

    // 3. Strict penalties for non-original formats / audio bloat
    if (/[\(\[\s-]*(live|concert|tour|unplugged|session)[\)\]\s-]*/i.test(fullTitle)) {
        score -= 200;
    }
    if (/[\(\[\s-]*(remix|mix|mixed|dub|club mix|rework|reconfigured)[\)\]\s-]*/i.test(fullTitle)) {
        score -= 150;
    }
    if (/[\(\[\s-]*(acoustic|orchestral|stripped|piano version)[\)\]\s-]*/i.test(fullTitle)) {
        score -= 80;
    }
    if (/[\(\[\s-]*(instrumental|karaoke|backing track|drumless)[\)\]\s-]*/i.test(fullTitle)) {
        score -= 500;
    }
    if (/[\(\[\s-]*(commentary|skit|speech|interview|snippet|intro|outro)[\)\]\s-]*/i.test(fullTitle)) {
        score -= 600;
    }
    if (/[\(\[\s-]*(radio edit|single version|edit)[\)\]\s-]*/i.test(fullTitle)) {
        score -= 10;
    }

    // 4. Bonus for clean, pure title (no parentheses or dashes)
    if (!fullTitle.includes('(') && !fullTitle.includes('[') && !fullTitle.includes(' - ')) {
        score += 80;
    }

    // 5. Penalty if album title indicates live, remix, or drumless compilation
    if (/live|concert|remix|drumless|reconfigured/i.test(albumTitle)) {
        score -= 100;
    }

    // 6. Prefer studio album track over single or EP
    if (track.record_type === 'album') {
        score += 30;
    } else if (track.record_type === 'single' || track.record_type === 'ep') {
        score += 15;
    }

    // 7. Chronological tie-break: earlier release year gets a small bonus (original studio release)
    if (track.release_date) {
        const year = parseInt(String(track.release_date).slice(0, 4), 10);
        if (!isNaN(year) && year > 1900 && year < 2100) {
            score += Math.max(0, 2035 - year);
        }
    }

    return score;
}

export function filterTracksByArtist(
    tracks: any[],
    nonOriginalKeywords: string[] = [],
) {
    const validTracks = tracks.filter(isPlayableTrack);

    const buckets = new Map<string, { track: any; score: number }>();
    const isrcToCanonical = new Map<string, string>();

    for (const track of validTracks) {
        const score = getTrackQualityScore(track);
        // Exclude unplayable or pure junk tracks (score < -300)
        if (score < -300) continue;

        let canonicalKey = cleanTrackTitle(track.title, track.title_short);
        if (!canonicalKey) continue;

        const artistId = track.artist?.id || 'artist';
        let fullKey = `${canonicalKey}-${artistId}`;

        // ISRC link check: if this recording master was already seen, map to same bucket
        if (track.isrc && isrcToCanonical.has(track.isrc)) {
            fullKey = isrcToCanonical.get(track.isrc)!;
        } else if (track.isrc) {
            isrcToCanonical.set(track.isrc, fullKey);
        }

        if (!buckets.has(fullKey)) {
            buckets.set(fullKey, { track, score });
        } else {
            const existing = buckets.get(fullKey)!;
            if (score > existing.score) {
                buckets.set(fullKey, { track, score });
            }
        }
    }

    const uniqueTracks = Array.from(buckets.values()).map((b) => b.track);

    // Сортуємо хронологічно за датою релізу (від найдавніших до найновіших)
    uniqueTracks.sort((a, b) => {
        const dateA = a?.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b?.release_date ? new Date(b.release_date).getTime() : 0;
        return dateA - dateB;
    });

    return uniqueTracks;
}
