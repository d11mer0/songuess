import {
    fetchBaseQuery,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

const apiBase = import.meta.env.PROD
    ? ''
    : (import.meta.env.VITE_API_URL || 'http://localhost:3000');
const workLink = apiBase ? `${apiBase.replace(/\/+$/, '')}/api` : '/api';

const getToken = () => localStorage.getItem('accessToken');

const baseQuery = fetchBaseQuery({
    baseUrl: workLink,
    credentials: 'include', // еквівалент withCredentials: true
    prepareHeaders: (headers, { getState }) => {
        const token = getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const customBaseQuery: BaseQueryFn<
    string | FetchArgs, // Тип аргументу (запит)
    unknown, // Очікуваний результат (може бути будь-яким)
    FetchBaseQueryError // Помилки від `fetchBaseQuery`
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // Перевіряємо, чи отримали 401 і чи є сенс оновлювати токен
    if (result.error && result.error.status === 401) {
        const urlStr = typeof args === 'string' ? args : args.url;
        const isAuthEndpoint = urlStr.includes('/auth/login') || urlStr.includes('/auth/register') || urlStr.includes('/auth/refresh');
        const hasStoredToken = Boolean(localStorage.getItem('accessToken'));

        if (!isAuthEndpoint && hasStoredToken) {
            const refreshResult = await baseQuery(
                '/auth/refresh',
                api,
                extraOptions,
            );
            const accessToken = (refreshResult.data as { accessToken?: string })
                ?.accessToken;
            if (accessToken) {
                // Зберігаємо новий токен
                localStorage.setItem('accessToken', accessToken);

                // Повторюємо оригінальний запит з новим токеном
                return await baseQuery(args, api, extraOptions);
            } else {
                localStorage.removeItem('accessToken');
                api.dispatch({ type: 'user/logout' });
            }
        }
    }

    return result;
};

export default customBaseQuery;
