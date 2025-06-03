import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

export const deezerApi = createApi({
    reducerPath: 'deezerApi',
    baseQuery: customBaseQuery,
    endpoints: (builder) => ({
        // 🔹 Отримати трек за ID
        getTrackById: builder.query({
            query: (trackId) => `/deezer/track/${trackId}`,
        }),

        // 🔹 Отримати альбом за ID
        getAlbumById: builder.query({
            query: (albumId) => `/deezer/album/${albumId}`,
        }),

        // 🔹 Отримати артиста за ID
        getArtistById: builder.query({
            query: (artistId) => `/deezer/artist/${artistId}`,
        }),
        getAlbumsByArtist: builder.query({
            query: (artistId) => `/deezer/artist/${artistId}/albums`,
        }),

        // 🔹 Отримати плейліст за ID
        getPlaylistById: builder.query({
            query: (playlistId) => `/deezer/playlist/${playlistId}`,
        }),

        // 🔹 Отримати топ-треки артиста
        getTopTracksByArtist: builder.query({
            query: (artistId) => `/deezer/artist/${artistId}/top-tracks`,
        }),

        getAllTracksByArtist: builder.query({
            query: (artistId) => `/deezer/artist/${artistId}/all-tracks`,
        }),

        searchPlaylistsByArtist: builder.query({
            query: (query) => `/deezer/artist-playlists?query=${query}`,
        }),

        // 🔹 Пошук (треки, альбоми, артисти, плейлісти)
        searchDeezer: builder.query({
            query: ({ query, type }) =>
                `/deezer/search?query=${query}&type=${type}`,
        }),
    }),
});

export const {
    useGetTrackByIdQuery,
    useGetAlbumByIdQuery,
    useGetArtistByIdQuery,
    useGetAlbumsByArtistQuery,
    useGetPlaylistByIdQuery,
    useGetTopTracksByArtistQuery,
    useSearchDeezerQuery,
    useGetAllTracksByArtistQuery, // Додаємо новий хук
    useSearchPlaylistsByArtistQuery,
} = deezerApi;
