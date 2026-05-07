import axios from 'axios';

/**
 * API CONFIGURATION
 * This baseURL looks for the Vercel/Production environment variable first.
 * If not found (local development), it dynamically uses your current Wi-Fi IP or localhost.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // ✨ THIS IS THE MAGIC LINE ✨
  // Without this, React will refuse to save the login cookie from Laravel!
  withCredentials: true, 
});

// ==========================================
// 1. REQUEST INTERCEPTOR
// ==========================================
// Automatically grabs your token and attaches it to every single request just before it fires
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

// ==========================================
// 2. RESPONSE INTERCEPTOR
// ==========================================
// Handles global errors (like expired tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login');
    
    // ✨ THE FIX: We tell Axios to leave the verify-email page alone!
    const isVerifyPage = window.location.pathname.includes('/verify-email');
    
    // Only kick them to login if it's a 401, NOT a login request, AND NOT the verify page.
    if (error.response?.status === 401 && !isLoginRequest && !isVerifyPage) {
      console.warn("Session expired or Unauthorized. Redirecting to login...");
      
      // Clear out the dead tokens
      localStorage.removeItem('cims_token');
      localStorage.removeItem('user'); 
      
      // Hard redirect to clear React state
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;