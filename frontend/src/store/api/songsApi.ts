import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

interface Song {
    id: string;
    title: string;
    author: string;
    duration: number;
    url: string;
}

export const songsApi = createApi({
    reducerPath: 'songsApi',
    baseQuery: customBaseQuery,
    tagTypes: ['Songs'],
    endpoints: (builder) => ({
        getSongs: builder.query<Song[], void>({
            query: () => '/songs',
            providesTags: ['Songs'],
        }),
        getSongById: builder.query<Song, string>({
            query: (id) => `/songs/${id}`,
            providesTags: (result, error, id) => [{ type: 'Songs', id }],
        }),
        createSong: builder.mutation<Song, Omit<Song, 'id'>>({
            query: (songData) => ({
                url: '/songs',
                method: 'POST',
                body: songData,
            }),
            invalidatesTags: ['Songs'],
        }),
        updateSong: builder.mutation<Song, Partial<Song> & { id: string }>({
            query: ({ id, ...songData }) => ({
                url: `/songs/${id}`,
                method: 'PUT',
                body: songData,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Songs', id }],
        }),
        deleteSong: builder.mutation<void, string>({
            query: (id) => ({
                url: `/songs/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Songs'],
        }),
    }),
});

export const {
    useGetSongsQuery,
    useGetSongByIdQuery,
    useCreateSongMutation,
    useUpdateSongMutation,
    useDeleteSongMutation,
} = songsApi;
