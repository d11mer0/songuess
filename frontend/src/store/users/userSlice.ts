import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { setAccessToken } from '../../utils/setAccessToken';

interface User {
    id: number;
    email?: string;
    login: string;
    name: string;
    avatar?: string;
    role?: string;
}

interface AuthResponse {
    accessToken: string;
    user: User;
}

interface UserState {
    isAuthenticated: boolean;
    user: User | null;
}

const initialState: UserState = {
    isAuthenticated: false,
    user: null,
};

const handleLogout = (state: UserState) => {
    state.isAuthenticated = false;
    state.user = null;
    setAccessToken(undefined);
};

const handleAuthSuccess = (
    state: UserState,
    action: PayloadAction<unknown>,
) => {
    const payload = action.payload as AuthResponse;
    if (payload?.accessToken) {
        setAccessToken(payload.accessToken);
    }
};

const setUser = (state: UserState, action: PayloadAction<unknown>) => {
    const payload = action.payload as User;
    if (payload?.id) {
        state.isAuthenticated = true;
        state.user = payload;
    }
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logout: handleLogout,
        setCredentials: handleAuthSuccess,
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(
                authApi.endpoints.login.matchFulfilled,
                handleAuthSuccess,
            )
            .addMatcher(
                authApi.endpoints.refresh.matchFulfilled,
                handleAuthSuccess,
            )
            .addMatcher(authApi.endpoints.refresh.matchRejected, handleLogout)
            .addMatcher(authApi.endpoints.logout.matchFulfilled, handleLogout)
            .addMatcher(authApi.endpoints.logout.matchRejected, handleLogout)
            .addMatcher(
                authApi.endpoints.googleLogin.matchFulfilled,
                handleAuthSuccess,
            )
            .addMatcher(userApi.endpoints.getMe.matchFulfilled, setUser);
    },
});

export const { logout, setCredentials, updateUser } = userSlice.actions;
export default userSlice.reducer;
