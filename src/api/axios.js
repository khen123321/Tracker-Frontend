import axios from 'axios';

/**
 * API CONFIGURATION
 * This baseURL will look for the Vercel environment variable first.
 * If it doesn't find it (like on your local laptop), it defaults to localhost.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 1. REQUEST INTERCEPTOR
// Automatically grabs your token and attaches it to every single request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cims_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. RESPONSE INTERCEPTOR
// If the server says "401 Unauthorized" (token expired), 
// it kicks the user back to the login page automatically.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is 401 and we aren't already on the login page
    const isLoginRequest = error.config?.url?.includes('/login');
    
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('cims_token');
      // Use window.location for a hard redirect to clear any bad state
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;