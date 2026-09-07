import { configureStore } from '@reduxjs/toolkit';
import userReducer from './users/userSlice';
import gameplayReducer from './gameplay/gameplaySlice';

import {
    authApi,
    songsApi,
    apiMiddlewares,
    userApi,
    spotifyApi,
    deezerApi,
    dailyApi,
    leaderboardApi,
    achievementsApi,
    liqpayApi,
} from './api';

const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [songsApi.reducerPath]: songsApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [spotifyApi.reducerPath]: spotifyApi.reducer,
        [deezerApi.reducerPath]: deezerApi.reducer,
        [dailyApi.reducerPath]: dailyApi.reducer,
        [leaderboardApi.reducerPath]: leaderboardApi.reducer,
        [achievementsApi.reducerPath]: achievementsApi.reducer,
        [liqpayApi.reducerPath]: liqpayApi.reducer,
        user: userReducer,
        gameplay: gameplayReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiMiddlewares),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;