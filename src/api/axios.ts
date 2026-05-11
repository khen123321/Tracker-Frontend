import axios from 'axios';

/**
 * API CONFIGURATION
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, 
});

// ==========================================
// 1. REQUEST INTERCEPTOR
// ==========================================
api.interceptors.request.use(
  (config) => {
    // ✨ Uses the correct Redux token key
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

// ==========================================
// 2. RESPONSE INTERCEPTOR
// ==========================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login');
    const isVerifyPage = window.location.pathname.includes('/verify-email');
    
    if (error.response?.status === 401 && !isLoginRequest && !isVerifyPage) {
      console.warn("Session expired or Unauthorized. Redirecting to login...");
      
      // ✨ THE FIX: Clear the correct Redux Saga keys to break the loop!
      localStorage.removeItem('cims_token');
      localStorage.removeItem('cims_user'); 
      
      // Hard redirect to clear React state
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;