export const setAccessToken = (token?: string) => {
    if (token) {
        localStorage.setItem("accessToken", token);
    } else {
        localStorage.removeItem("accessToken");
    }
};