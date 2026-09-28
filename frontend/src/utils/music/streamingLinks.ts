export interface StreamingLinkItem {
    id: 'spotify' | 'deezer' | 'apple' | 'youtube' | 'soundcloud' | 'genius';
    name: string;
    url: string;
    color: string;
}

export function getTrackStreamingLinks(
    trackTitle: string,
    artistName?: string,
    directDeezerLink?: string
): StreamingLinkItem[] {
    const query = `${trackTitle} ${artistName || ''}`.trim();
    const encodedQuery = encodeURIComponent(query);

    return [
        {
            id: 'spotify',
            name: 'Spotify',
            url: `https://open.spotify.com/search/${encodedQuery}`,
            color: '#1db954',
        },
        {
            id: 'deezer',
            name: 'Deezer',
            url: directDeezerLink || `https://www.deezer.com/search/${encodedQuery}`,
            color: '#ef5466',
        },
        {
            id: 'apple',
            name: 'Apple Music',
            url: `https://music.apple.com/search?term=${encodedQuery}`,
            color: '#fc3c44',
        },
        {
            id: 'youtube',
            name: 'YouTube',
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}`,
            color: '#ff0000',
        },
        {
            id: 'soundcloud',
            name: 'SoundCloud',
            url: `https://soundcloud.com/search?q=${encodedQuery}`,
            color: '#ff5500',
        },
        {
            id: 'genius',
            name: 'Genius',
            url: `https://genius.com/search?q=${encodedQuery}`,
            color: '#ffff64',
        },
    ];
}

export function getArtistStreamingLinks(
    artistName: string,
    directDeezerLink?: string
): StreamingLinkItem[] {
    const encoded = encodeURIComponent(artistName.trim());

    return [
        {
            id: 'spotify',
            name: 'Spotify',
            url: `https://open.spotify.com/search/${encoded}`,
            color: '#1db954',
        },
        {
            id: 'deezer',
            name: 'Deezer',
            url: directDeezerLink || `https://www.deezer.com/search/${encoded}`,
            color: '#ef5466',
        },
        {
            id: 'apple',
            name: 'Apple Music',
            url: `https://music.apple.com/search?term=${encoded}`,
            color: '#fc3c44',
        },
        {
            id: 'youtube',
            name: 'YouTube',
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(artistName.trim() + ' songs')}`,
            color: '#ff0000',
        },
    ];
}
