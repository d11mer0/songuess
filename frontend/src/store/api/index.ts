import { authApi } from './authApi';
import { songsApi } from './songsApi';
import { userApi } from './userApi';

export const apiMiddlewares = [authApi.middleware, songsApi.middleware, userApi.middleware];

export { authApi, songsApi, userApi };