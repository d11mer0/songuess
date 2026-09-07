import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

export interface AchievementItem {
    id: string;
    titleUk: string;
    titleEn: string;
    descUk: string;
    descEn: string;
    icon: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    category: 'GAMEPLAY' | 'DAILY' | 'DONATION' | 'SOCIAL';
    isUnlocked: boolean;
    unlockedAt: string | null;
}

export interface AchievementsResponse {
    totalUnlocked: number;
    totalCount: number;
    percentage: number;
    achievements: AchievementItem[];
}

export const achievementsApi = createApi({
    reducerPath: 'achievementsApi',
    baseQuery: customBaseQuery,
    tagTypes: ['Achievements'],
    endpoints: (builder) => ({
        getMyAchievements: builder.query<AchievementsResponse, void>({
            query: () => '/achievements/my',
            providesTags: ['Achievements'],
        }),
        getUserAchievements: builder.query<AchievementsResponse, number>({
            query: (id) => `/achievements/user/${id}`,
        }),
    }),
});

export const { useGetMyAchievementsQuery, useGetUserAchievementsQuery } = achievementsApi;