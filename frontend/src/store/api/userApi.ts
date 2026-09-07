import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

interface User {
    id: string | number;
    email: string;
    login: string;
    name?: string;
    avatar?: string;
    role?: string;
    record?: number;
    isPremium?: boolean;
    nameColor?: string;
    customTitle?: string;
    dailyStreak?: number;
    maxDailyStreak?: number;
}

interface UpdateProfileData {
    email?: string;
    password?: string;
    login?: string;
}

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: customBaseQuery,
    tagTypes: ['User'],
    endpoints: (builder) => ({
        getMe: builder.query<User, void>({
            query: () => '/user/me',
            providesTags: ['User'],
        }),
        updateProfile: builder.mutation<User, UpdateProfileData>({
            query: (data) => ({
                url: '/user/update-profile',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),

        updateAvatar: builder.mutation<{ avatar: string }, FormData>({
            query: (data) => ({
                url: '/user/update-avatar',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        updatePresetAvatar: builder.mutation<{ avatar: string }, { presetId: string }>({
            query: (body) => ({
                url: '/user/preset-avatar',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['User'],
        }),
        updateCosmetics: builder.mutation<{ nameColor?: string; customTitle?: string }, { nameColor?: string; customTitle?: string }>({
            query: (body) => ({
                url: '/user/cosmetics',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['User'],
        }),
        deleteUser: builder.mutation<void, void>({
            query: () => ({
                url: '/user',
                method: 'DELETE',
            }),
        }),
        getUserById: builder.query<User, string | number>({
            query: (id) => `/user/${id}`,
        }),
    }),
});

export const {
    useGetMeQuery,
    useUpdateProfileMutation,
    useUpdateAvatarMutation,
    useUpdatePresetAvatarMutation,
    useUpdateCosmeticsMutation,
    useDeleteUserMutation,
    useGetUserByIdQuery,
} = userApi;
