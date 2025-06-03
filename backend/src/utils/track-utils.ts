export function normalizeTitle(title: string): string {
    return title
        .trim()
        .toLowerCase()
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'");
}

export function filterTracks(tracks: any[]) {
    return tracks.filter((track) => track.preview && track.preview !== '');
}

export function filterTracksByArtist(
    tracks: any[],
    nonOriginalKeywords: string[],
) {
    tracks = tracks.filter((track) => !!track?.preview);

    tracks.sort(
        (a, b) =>
            new Date(a?.release_date).getTime() -
            new Date(b?.release_date).getTime(),
    );

    const trackMap = new Map<string, any>();

    for (let i = 0; i < tracks.length; i++) {
        const currentTrack = tracks[i];
        if (!currentTrack) continue;

        const normalizedTitle = normalizeTitle(currentTrack.title);
        const trackKey = `${normalizedTitle}-${currentTrack.artist.id}`;

        if (!trackMap.has(trackKey)) {
            trackMap.set(trackKey, currentTrack);
        } else {
            const existingTrack = trackMap.get(trackKey)!;
            if (
                new Date(currentTrack?.release_date) <
                new Date(existingTrack?.release_date)
            ) {
                trackMap.set(trackKey, currentTrack);
            }
            continue;
        }

        for (let j = i + 1; j < tracks.length; j++) {
            const compareTrack = tracks[j];
            if (!compareTrack) continue;

            const normalizedCompareTitle = normalizeTitle(compareTrack.title);
            if (normalizedCompareTitle.includes(normalizedTitle)) {
                if (
                    nonOriginalKeywords.some((keyword) =>
                        normalizedCompareTitle.includes(keyword),
                    )
                ) {
                    tracks[j] = null;
                }
            }
        }
    }

    return Array.from(trackMap.values()).filter(Boolean);
}
