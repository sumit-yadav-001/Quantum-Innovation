import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create base axios instance
const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Inject JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('hrms_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Extract Data & Normalize Errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    let errorMessage = 'An unexpected network error occurred.';

    if (error.response) {
      // Server responded with non-2xx code
      const responseData = error.response.data as any;
      errorMessage = responseData?.message || errorMessage;

      // Auto-handle 401 Unauthorized — clear tokens but don't redirect here
      // (redirect is handled by RequireAuth component via Redux state)
      if (error.response.status === 401) {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
      }
    } else if (error.request) {
      // Request made but no response — MSW not running or network issue
      errorMessage = 'Service unavailable. Mock API may not be active.';
    } else {
      errorMessage = error.message;
    }

    const normalizedError = {
      message: errorMessage,
      status: (error.response?.status) ?? 0,
      originalError: error,
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
