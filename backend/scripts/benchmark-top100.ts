import {
    filterTracksByArtist,
    isValidPreviewUrl,
    isPlayableTrack,
} from '../src/utils/track-utils';

interface DeezerArtist {
    id: number;
    name: string;
    position?: number;
}

interface ArtistBenchmarkResult {
    rank: number;
    artistId: number;
    artistName: string;
    rawCount: number;
    beforeCount: number;
    afterCount: number;
    validPreviewsCount: number;
    allPreviewsValid: boolean;
    sampleDuplicatesCleaned: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 3, delay = 1200): Promise<any> {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data?.error) {
                if (i < retries && (data.error.code === 4 || data.error.message?.includes('quota'))) {
                    await sleep(delay * (i + 1));
                    continue;
                }
                return null;
            }
            return data;
        } catch {
            if (i < retries) {
                await sleep(delay * (i + 1));
                continue;
            }
            return null;
        }
    }
    return null;
}

// Old Naive Algorithm (Before Improvements)
function runBeforeAlgorithm(tracks: any[]): any[] {
    const valid = tracks.filter((t) => t?.preview && t.preview !== '');
    const seen = new Set<string>();
    const result: any[] = [];
    for (const t of valid) {
        const titleKey = (t.title || '').trim().toLowerCase();
        if (!seen.has(titleKey)) {
            seen.add(titleKey);
            result.push(t);
        }
    }
    return result;
}

async function runBenchmark() {
    console.log('🚀 [Benchmark] Fetching Top 100 artists from Deezer Charts...');
    const chartRes = await fetchWithRetry('https://api.deezer.com/chart/0/artists?limit=100');
    let artists: DeezerArtist[] = chartRes?.data || [];

    // Filter out non-music / spoken-word drama (e.g. Die drei ???)
    artists = artists.filter((a) => !a.name.includes('Die drei ???'));

    // If chart had fewer than 100, add well-known global legends to ensure 100 artists
    const backupArtists: DeezerArtist[] = [
        { id: 12246, name: 'Taylor Swift' },
        { id: 92, name: 'Linkin Park' },
        { id: 13, name: 'Eminem' },
        { id: 259, name: 'Michael Jackson' },
        { id: 412, name: 'Queen' },
        { id: 1424821, name: 'Lana Del Rey' },
        { id: 27, name: 'Daft Punk' },
        { id: 384, name: 'Coldplay' },
        { id: 300, name: 'Dua Lipa' },
        { id: 700, name: 'Metallica' },
        { id: 4050205, name: 'The Weeknd' },
        { id: 144227, name: 'Kanye West' },
        { id: 1109673, name: 'Billie Eilish' },
        { id: 2467, name: 'Rihanna' },
        { id: 840, name: 'Bruno Mars' },
        { id: 119, name: 'Metallica' },
        { id: 139, name: 'AC/DC' },
        { id: 367, name: 'Nirvana' },
        { id: 388, name: 'Red Hot Chili Peppers' },
        { id: 1188, name: 'Radiohead' },
        { id: 500, name: 'Gorillaz' },
        { id: 75798, name: 'Adele' },
        { id: 415, name: 'Guns N Roses' },
        { id: 892, name: 'Oasis' },
        { id: 288166, name: 'Ed Sheeran' },
    ];

    for (const b of backupArtists) {
        if (!artists.some((a) => a.id === b.id || a.name.toLowerCase() === b.name.toLowerCase())) {
            artists.push(b);
        }
    }

    artists = artists.slice(0, 100);
    console.log(`✅ Loaded ${artists.length} artists to benchmark.`);

    const nonOriginalKeywords = [
        'live',
        'remix',
        'mixed',
        'extended',
        'version',
        'edition',
        'edit',
        'bonus',
        'feat',
    ];

    const results: ArtistBenchmarkResult[] = [];
    let totalRawTracks = 0;
    let totalBeforeTracks = 0;
    let totalAfterTracks = 0;
    let totalInvalidPreviewsInAfter = 0;
    let totalDuplicatesEliminated = 0;

    console.log('\n--- Running Comparison for Top-100 Artists ---');

    for (let i = 0; i < artists.length; i++) {
        const artist = artists[i];
        // 1. Fetch releases for artist (albums, singles, EPs)
        const albumsRes = await fetchWithRetry(
            `https://api.deezer.com/artist/${artist.id}/albums?limit=25`,
        );
        const albums: any[] = albumsRes?.data || [];

        // 2. Fetch tracks for top releases
        let rawTracks: any[] = [];
        const albumsToFetch = albums.slice(0, 12); // Sample top 12 releases per artist

        for (const alb of albumsToFetch) {
            const tracksRes = await fetchWithRetry(
                `https://api.deezer.com/album/${alb.id}/tracks?limit=100`,
            );
            if (tracksRes?.data && Array.isArray(tracksRes.data)) {
                for (const t of tracksRes.data) {
                    rawTracks.push({
                        ...t,
                        record_type: alb.record_type,
                        release_date: alb.release_date || t.release_date,
                        album: {
                            id: alb.id,
                            title: alb.title,
                            picture: alb.cover_big || alb.cover,
                        },
                    });
                }
            }
            await sleep(60); // Gentle pause to respect rate limits
        }

        // 3. Run BEFORE algorithm
        const beforeTracks = runBeforeAlgorithm(rawTracks);

        // 4. Run AFTER algorithm (Our smart deduplication & preview check)
        const afterTracks = filterTracksByArtist(rawTracks, nonOriginalKeywords);

        // 5. Check Preview URL integrity in AFTER algorithm
        let validPreviewsCount = 0;
        for (const t of afterTracks) {
            if (isValidPreviewUrl(t.preview) && isPlayableTrack(t)) {
                validPreviewsCount++;
            } else {
                totalInvalidPreviewsInAfter++;
            }
        }

        const allPreviewsValid = validPreviewsCount === afterTracks.length;

        // Sample duplicates eliminated
        const afterIds = new Set(afterTracks.map((t) => t.id));
        const sampleDups = rawTracks
            .filter((t) => !afterIds.has(t.id) && t.preview)
            .slice(0, 3)
            .map((t) => t.title);

        const res: ArtistBenchmarkResult = {
            rank: i + 1,
            artistId: artist.id,
            artistName: artist.name,
            rawCount: rawTracks.length,
            beforeCount: beforeTracks.length,
            afterCount: afterTracks.length,
            validPreviewsCount,
            allPreviewsValid,
            sampleDuplicatesCleaned: sampleDups,
        };

        results.push(res);
        totalRawTracks += rawTracks.length;
        totalBeforeTracks += beforeTracks.length;
        totalAfterTracks += afterTracks.length;
        totalDuplicatesEliminated += rawTracks.length - afterTracks.length;

        console.log(
            `[${String(i + 1).padStart(3)}/100] ${artist.name.padEnd(25)} | Raw: ${String(rawTracks.length).padStart(3)} | Before: ${String(beforeTracks.length).padStart(3)} | After: ${String(afterTracks.length).padStart(3)} | Previews 100%: ${allPreviewsValid ? '✅ YES' : '❌ NO'}`,
        );

        await sleep(80);
    }

    console.log('\n================================================================');
    console.log('                 BENCHMARK SUMMARY RESULTS                     ');
    console.log('================================================================');
    console.log(`Total Artists Tested:           ${results.length}`);
    console.log(`Total Raw Tracks Scanned:       ${totalRawTracks}`);
    console.log(`Total Tracks (Old Algorithm):   ${totalBeforeTracks}`);
    console.log(`Total Tracks (New Algorithm):   ${totalAfterTracks}`);
    console.log(`Duplicate/Junk Tracks Removed:  ${totalDuplicatesEliminated}`);
    console.log(
        `Tracks with 100% Valid Preview: ${totalAfterTracks - totalInvalidPreviewsInAfter} / ${totalAfterTracks} (${totalInvalidPreviewsInAfter === 0 ? '100.0% PERFECT ✅' : 'FAILED ❌'})`,
    );
    console.log('================================================================\n');

    // Save full JSON output for detailed analysis
    const fs = await import('fs');
    fs.writeFileSync(
        './scripts/benchmark-results.json',
        JSON.stringify({ summary: { totalRawTracks, totalBeforeTracks, totalAfterTracks, totalInvalidPreviewsInAfter, totalDuplicatesEliminated }, results }, null, 2),
    );
    console.log('Full JSON results saved to ./scripts/benchmark-results.json');
}

runBenchmark().catch(console.error);
