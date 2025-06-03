import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

export const spotifyApi = createApi({
    reducerPath: 'spotifyApi',
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        searchArtist: builder.query({
            query: (artistName) => `/spotify/search?query=${artistName}`,
        }),
        getTopTracks: builder.query({
            query: (artistId) => `/spotify/top-tracks?artistId=${artistId}`,
        }),
        getArtistAlbums: builder.query({
            query: (artistId) => `/spotify/albums?artistId=${artistId}`,
        }),
        getAlbumTracks: builder.query({
            query: (albumId) => `/spotify/album-tracks?albumId=${albumId}`,
        }),

        // 🔹 Нові запити:
        searchAlbum: builder.query({
            query: (albumName) => `/spotify/search-album?query=${albumName}`,
        }),
        getAlbumInfo: builder.query({
            query: (albumId) => `/spotify/album-info?albumId=${albumId}`,
        }),
    }),
});

export const {
    useSearchArtistQuery,
    useGetTopTracksQuery,
    useGetArtistAlbumsQuery,
    useGetAlbumTracksQuery,
    useSearchAlbumQuery,
    useGetAlbumInfoQuery,
} = spotifyApi;
