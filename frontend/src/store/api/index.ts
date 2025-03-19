import { authApi } from './authApi';
import { deezerApi } from './deezerApi';
import { songsApi } from './songsApi';
import { spotifyApi } from './spotifyApi';
import { userApi } from './userApi';

export const apiMiddlewares = [
    authApi.middleware, 
    songsApi.middleware, 
    userApi.middleware, 
    spotifyApi.middleware, 
    deezerApi.middleware
];

export { authApi, songsApi, userApi, spotifyApi, deezerApi };