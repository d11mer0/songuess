import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

export interface DailyChallengeResponse {
    dayNumber: number;
    date: string;
    preview: string;
    isCompleted: boolean;
    isSolved: boolean;
    guessesCount: number;
    options: string[];
    streak: number;
    maxStreak: number;
    track: {
        title: string;
        artistName: string;
    } | null;
    shareText: string | null;
}

export interface DailyGuessResponse {
    isCorrect: boolean;
    isGameOver: boolean;
    attemptsUsed?: number;
    attemptsLeft?: number;
    track?: {
        title: string;
        artistName: string;
    };
    streak?: number;
    maxStreak?: number;
    shareText?: string;
}

export const dailyApi = createApi({
    reducerPath: 'dailyApi',
    baseQuery: customBaseQuery,
    tagTypes: ['Daily'],
    keepUnusedDataFor: 300,
    endpoints: (builder) => ({
        getDailyChallenge: builder.query<DailyChallengeResponse, void>({
            query: () => '/daily',
            providesTags: ['Daily'],
        }),
        submitDailyGuess: builder.mutation<DailyGuessResponse, { guess: string; attempt: number }>({
            query: (body) => ({
                url: '/daily/guess',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Daily'],
        }),
    }),
});

export const { useGetDailyChallengeQuery, useSubmitDailyGuessMutation } = dailyApi;