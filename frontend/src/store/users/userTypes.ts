
export interface User {
    id: number;
    email?: string;
    login: string;
    name: string;
    avatar?: string;
    role?: string;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}

export interface UserState {
    isAuthenticated: boolean;
    user: User | null;
}
