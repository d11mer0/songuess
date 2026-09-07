import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

export interface LeaderboardEntry {
    rank: number;
    userId: number;
    login: string;
    avatar: string | null;
    totalScore: number;
    highScore: number;
    gamesPlayed: number;
    dailyStreak: number;
    isPremium?: boolean;
    customTitle?: string | null;
    nameColor?: string | null;
}

export interface LeaderboardResponse {
    period: string;
    genre: string;
    totalPlayers: number;
    entries: LeaderboardEntry[];
    currentUserRank: LeaderboardEntry | null;
}

export const leaderboardApi = createApi({
    reducerPath: 'leaderboardApi',
    baseQuery: customBaseQuery,
    keepUnusedDataFor: 300,
    endpoints: (builder) => ({
        getLeaderboard: builder.query<LeaderboardResponse, { period?: string; genre?: string }>({
            query: ({ period = 'all_time', genre = 'all' } = {}) =>
                `/leaderboards?period=${period}&genre=${genre}`,
        }),
    }),
});

export const { useGetLeaderboardQuery } = leaderboardApi;