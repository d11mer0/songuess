import { authApi } from './authApi';
import { deezerApi } from './deezerApi';
import { songsApi } from './songsApi';
import { spotifyApi } from './spotifyApi';
import { userApi } from './userApi';
import { dailyApi } from './dailyApi';
import { leaderboardApi } from './leaderboardApi';
import { achievementsApi } from './achievementsApi';
import { liqpayApi } from './liqpayApi';

export const apiMiddlewares = [
    authApi.middleware,
    songsApi.middleware,
    userApi.middleware,
    spotifyApi.middleware,
    deezerApi.middleware,
    dailyApi.middleware,
    leaderboardApi.middleware,
    achievementsApi.middleware,
    liqpayApi.middleware,
];

export {
    authApi,
    songsApi,
    userApi,
    spotifyApi,
    deezerApi,
    dailyApi,
    leaderboardApi,
    achievementsApi,
    liqpayApi,
};