import { configureStore } from '@reduxjs/toolkit';
import userReducer from './users/userSlice';
import { authApi, songsApi, apiMiddlewares, userApi } from './api';

const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [songsApi.reducerPath]: songsApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiMiddlewares),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;