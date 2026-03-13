// src/api/axios.ts
import axios, { AxiosError } from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000', // TODO: move to env for prod
    withCredentials: true,   // required for cookies
});
// Attach access token dynamically (optional helper)
export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

// Interceptor: if access token is expired (401), try refresh once
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const refreshRes = await api.post("/auth/refresh");
                const newToken = (refreshRes.data as any).token;

                setAuthToken(newToken);
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed → let caller handle (usually logout)
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
