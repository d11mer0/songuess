import {
    fetchBaseQuery,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

const workLink = import.meta.env.VITE_API_URL + '/api';

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

    // Перевіряємо, чи отримали 401 і чи це не повторний запит
    if (result.error && result.error.status === 401) {
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
            api.dispatch({ type: 'user/logout' }); // 🔹 Викликаємо logout через `type`, без імпорту
        }
    }

    return result;
};

export default customBaseQuery;
