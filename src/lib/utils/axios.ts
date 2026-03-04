import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7004/api';
const isProduction = process.env.NODE_ENV === 'production';

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: isProduction ? 10000 : 30000,
    withCredentials: true, // Crucial for sending/receiving cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Configure Retries
axiosRetry(axiosInstance, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        // Only retry on network errors or 5xx server errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            (error.response?.status ? error.response.status >= 500 : false);
    },
});

// Request interceptor for logging
axiosInstance.interceptors.request.use(
    (config) => {
        if (!isProduction) {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => {
        if (!isProduction) {
            console.log(`[API Response] ${response.status} ${response.config.url}`);
        }
        return response;
    },
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            const url = error.config?.url || '';
            const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
            // Never auto-redirect for background auth-check (auth/user) or logout calls.
            // logout() handles its own redirect; checkAuth() handles its own failure silently.
            const isBackgroundAuthCall = url.includes('auth/user') || url.includes('auth/logout');

            if (typeof window !== 'undefined' && !isLoginPage && !isBackgroundAuthCall) {
                window.location.href = '/login?expired=true';
            }
        }

        if (!isProduction) {
            const url = error.config?.url || '';
            const isExpectedAuthCall = url.includes('auth/user') || url.includes('auth/logout');
            // Don't clutter the console with expected 401s from background auth checks
            if (!isExpectedAuthCall || status !== 401) {
                console.error(`[API Error] ${status || 'Network Error'} ${error.config?.url}`, error.response?.data);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
