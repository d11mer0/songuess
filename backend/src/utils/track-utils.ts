export function normalizeTitle(title: string): string {
    return title
        .trim()
        .toLowerCase()
        .replace(/[\u2018\u2019\u201A\u201B`´]/g, "'");
}

export function cleanTrackTitle(title: string): string {
    if (!title) return '';
    let t = title.trim().toLowerCase();
    t = t.replace(/[\u2018\u2019\u201A\u201B`´]/g, "'");
    t = t.replace(/[\u2013\u2014]/g, '-');

    // 1. Parenthesized / Bracketed non-original or feature tags
    t = t.replace(/\s*[\(\[](feat|ft|featuring|with)\.?\s+[^\)\]]+[\)\]]/gi, '');
    t = t.replace(
        /\s*[\(\[][^\)\]]*(remaster|anniversary|deluxe|edition|reissue|mono|stereo|bonus|expanded)[^\)\]]*[\)\]]/gi,
        '',
    );
    t = t.replace(
        /\s*[\(\[][^\)\]]*(live|concert|tour|unplugged|bbc|mtv|session|acoustic|orchestral)[^\)\]]*[\)\]]/gi,
        '',
    );
    t = t.replace(
        /\s*[\(\[][^\)\]]*(remix|mix|mixed|dub|radio edit|club mix|extended|version|single version|album version|original mix|short edit|edit)[^\)\]]*[\)\]]/gi,
        '',
    );

    // 2. Trailing hyphenated tags: - Live..., - Remaster..., - PNAU Remix..., - Radio Edit...
    t = t.replace(/\s*-\s*(feat|ft|featuring|with)\.?\s+.+$/gi, '');
    t = t.replace(
        /\s*-\s*.*?(remaster|anniversary|live|concert|tour|remix|mix|radio edit|single version|album version|bonus track|acoustic|mono|stereo|deluxe|edit|version|\d{4}\s*remaster).*$/gi,
        '',
    );

    // 3. Punctuation & extra whitespace cleanup
    t = t.replace(/[^\w\s\u0400-\u04FF]/gi, '');
    t = t.replace(/\s+/g, ' ').trim();

    return (
        t ||
        normalizeTitle(title).replace(/[^\w\s\u0400-\u04FF]/gi, '').trim() ||
        title.trim().toLowerCase()
    );
}

export function getTrackQualityScore(track: any): number {
    if (!track || !track.preview) return -10000;
    let score = 0;
    const title = (track.title || '').toLowerCase();
    const albumTitle = (track.album?.title || '').toLowerCase();

    // 1. Base score from Deezer popularity rank (0 - 100)
    if (typeof track.rank === 'number' && track.rank > 0) {
        score += Math.min(100, Math.floor(track.rank / 10000));
    }

    // 2. Strict penalties for non-original formats / audio bloat
    if (/[\(\[\s-]*(live|concert|tour|unplugged|session)[\)\]\s-]*/i.test(title)) {
        score -= 200;
    }
    if (/[\(\[\s-]*(remix|mix|mixed|dub|club mix|rework)[\)\]\s-]*/i.test(title)) {
        score -= 150;
    }
    if (/[\(\[\s-]*(acoustic|orchestral|stripped|piano version)[\)\]\s-]*/i.test(title)) {
        score -= 80;
    }
    if (/[\(\[\s-]*(instrumental|karaoke|backing track)[\)\]\s-]*/i.test(title)) {
        score -= 500;
    }
    if (/[\(\[\s-]*(commentary|skit|speech|interview|snippet|intro|outro)[\)\]\s-]*/i.test(title)) {
        score -= 600;
    }
    if (/[\(\[\s-]*(radio edit|single version|edit)[\)\]\s-]*/i.test(title)) {
        score -= 10;
    }

    // 3. Bonus for clean, pure title (no parentheses or dashes)
    if (!title.includes('(') && !title.includes('[') && !title.includes(' - ')) {
        score += 80;
    }

    // 4. Penalty if album title indicates live or remix compilation
    if (/live|concert|remix/i.test(albumTitle)) {
        score -= 100;
    }

    // 5. Prefer studio album track over single or EP
    if (track.record_type === 'album') {
        score += 30;
    } else if (track.record_type === 'single' || track.record_type === 'ep') {
        score += 15;
    }

    // 6. Chronological tie-break: earlier release year gets a small bonus (original studio release)
    if (track.release_date) {
        const year = parseInt(String(track.release_date).slice(0, 4), 10);
        if (!isNaN(year) && year > 1900 && year < 2100) {
            score += Math.max(0, 2035 - year);
        }
    }

    return score;
}

export function filterTracks(tracks: any[]) {
    return tracks.filter((track) => track.preview && track.preview !== '');
}

export function filterTracksByArtist(
    tracks: any[],
    nonOriginalKeywords: string[] = [],
) {
    const validTracks = tracks.filter((track) => !!track?.preview);

    const buckets = new Map<string, { track: any; score: number }>();
    const isrcToCanonical = new Map<string, string>();

    for (const track of validTracks) {
        const score = getTrackQualityScore(track);
        // Exclude unplayable or pure junk tracks
        if (score < -300) continue;

        let canonicalKey = cleanTrackTitle(track.title);
        const artistId = track.artist?.id || 'artist';
        let fullKey = `${canonicalKey}-${artistId}`;

        // ISRC link check: if this recording was already seen, map to same bucket
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
