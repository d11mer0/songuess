import {
    fetchBaseQuery,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

const apiBase = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '' : 'http://localhost:3000')
).replace(/\/+$/, '');
const workLink = apiBase ? `${apiBase}/api` : '/api';

const getToken = () => localStorage.getItem('accessToken');

const baseQuery = fetchBaseQuery({
    baseUrl: workLink,
    credentials: 'include',
    prepareHeaders: (headers) => {
        const token = getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

let refreshPromise: Promise<string | null> | null = null;

const customBaseQuery: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        const urlStr = typeof args === 'string' ? args : args.url;
        const isAuthEndpoint =
            urlStr.includes('/auth/login') ||
            urlStr.includes('/auth/register') ||
            urlStr.includes('/auth/refresh');
        const hasStoredToken = Boolean(localStorage.getItem('accessToken'));

        if (!isAuthEndpoint && hasStoredToken) {
            if (!refreshPromise) {
                refreshPromise = (async () => {
                    try {
                        const refreshResult = await baseQuery(
                            '/auth/refresh',
                            api,
                            extraOptions,
                        );
                        const newToken = (
                            refreshResult.data as { accessToken?: string }
                        )?.accessToken;
                        if (newToken) {
                            localStorage.setItem('accessToken', newToken);
                            return newToken;
                        }
                        localStorage.removeItem('accessToken');
                        api.dispatch({ type: 'user/logout' });
                        return null;
                    } finally {
                        refreshPromise = null;
                    }
                })();
            }

            const accessToken = await refreshPromise;
            if (accessToken) {
                return await baseQuery(args, api, extraOptions);
            }
        }
    }

    return result;
};

export default customBaseQuery;
