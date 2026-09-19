import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

export interface CheckRoomResponse {
    exists: boolean;
    roomId?: string;
    shortCode?: string;
    state?: string;
    isPartyMode?: boolean;
    isFull?: boolean;
    playerCount?: number;
    maxPlayers?: number;
    error?: string;
}

export const gameApi = createApi({
    reducerPath: 'gameApi',
    baseQuery: customBaseQuery,
    tagTypes: ['GameRoom'],
    endpoints: (builder) => ({
        checkRoom: builder.query<CheckRoomResponse, string>({
            query: (code) => `/game/room/${encodeURIComponent(code)}/check`,
        }),
    }),
});

export const { useCheckRoomQuery, useLazyCheckRoomQuery } = gameApi;
