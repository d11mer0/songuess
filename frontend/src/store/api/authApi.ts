import { createApi, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';
import { userApi } from './userApi';
import { TokenType } from '../../constants/constants';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    register: builder.mutation<void, { email: string; password: string }>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    login: builder.mutation<void, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          await dispatch(userApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap();
        } catch (error) {}
      },
    }),
    refresh: builder.query<{ accessToken: string }, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'GET',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(userApi.endpoints.getMe.initiate(undefined));
        } catch {} // Якщо не потрібно логувати помилку
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    verifyEmail: builder.mutation<void, string>({
      query: (token) => ({
        url: `/auth/verify-email/${token}`,
        method: 'GET',
      }),
    }),
    sendToken: builder.mutation<void, { email: string; type: TokenType }>({
      query: ({ email, type }) => ({
        url: '/auth/send-token-email',
        method: 'POST',
        body: { email, type },
      }),
    }),
    resetPassword: builder.mutation<void, { token: string; newPassword: string }>({
      query: ({ token, newPassword }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { token, newPassword },
      }),
    }),
    googleLogin: builder.mutation<void, string>({
      query: (id_token) => ({
        url: '/auth/google',
        method: 'POST',
        body: { id_token },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          await dispatch(userApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap();
        } catch (error) {}
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLazyRefreshQuery,
  useLogoutMutation,
  useVerifyEmailMutation,
  useSendTokenMutation,
  useResetPasswordMutation,
  useGoogleLoginMutation,
} = authApi;