import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from './customBaseQuery';

interface User {
  id: string;
  email: string;
  login: string;
  name?: string;
  avatar?: string;
  role?: string;
}


interface UpdateProfileData {
  email?: string;
  password?: string;
  login?: string; // Додано
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: customBaseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => '/user/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<User, UpdateProfileData>({
      query: (data) => ({
        url: '/user/update-profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    updateAvatar: builder.mutation<{ avatar: string }, FormData>({
      query: (data) => ({
        url: "/user/update-avatar",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    deleteUser: builder.mutation<void, void>({
      query: () => ({
        url: '/user',
        method: 'DELETE',
      }),
    }),
    getUserById: builder.query<User, string>({
      query: (id) => `/user/${id}`,
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateProfileMutation,
  useUpdateAvatarMutation,
  useDeleteUserMutation,
  useGetUserByIdQuery,
} = userApi;