import axios, { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

const customInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 second timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// interceptor for adding auth tokens, request logging, etc.
customInstance.interceptors.request.use(
  (config) => {
    // timestamp to requests for debugging
    if (config) {
      (config as any).metadata = { startTime: new Date() };
    }

    // Get token from localStorage and add to headers
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// interceptor for error handling and response transformation
customInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { config } = response;
    const duration = ((config as any)?.metadata?.startTime)
      ? new Date().getTime() - (config as any).metadata.startTime.getTime()
      : 0;
    
    console.log(`✅ API Response: ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`);
    return response;
  },
  (error: AxiosError) => {
    const { config, response } = error;
    const duration = ((config as any)?.metadata?.startTime)
      ? new Date().getTime() - (config as any).metadata.startTime.getTime()
      : 0;
    
    console.error(`❌ API Error: ${config?.method?.toUpperCase()} ${config?.url} (${duration}ms)`, {
      status: response?.status,
      data: response?.data,
    });

    // Handle different error types
    if (response?.status === 401) {
      toast.error('Authentication required');
    } else if (response?.status === 403) {
      toast.error('Access denied');
    } else if (response?.status === 404) {
      toast.error('Resource not found');
    } else if (response?.status === 413) {
      toast.error('File too large');
    } else if (response?.status && response.status >= 500) {
      toast.error('Server error - please try again later');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout - please check your connection');
    } else {
      // Generic error handling
      const errorMessage = (response?.data as any)?.detail || error.message || 'An unexpected error occurred';
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}

export default customInstance;