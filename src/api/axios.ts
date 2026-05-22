import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create base axios instance
const apiClient = axios.create({
  timeout: 10000,
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
    // Normalize error details
    let errorMessage = 'An unexpected network error occurred.';
    
    if (error.response) {
      // Server responded with non-2xx code
      const responseData = error.response.data as any;
      errorMessage = responseData?.message || errorMessage;
      
      // Auto-handle 401 Unauthorized (e.g., clear tokens and trigger reload or handle in hook)
      if (error.response.status === 401) {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
      }
    } else if (error.request) {
      // Request made but no response received
      errorMessage = 'No response received from the server. Please check your network connection.';
    } else {
      // Error in setting up request
      errorMessage = error.message;
    }

    const normalizedError = {
      message: errorMessage,
      status: error.response?.status,
      originalError: error,
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
