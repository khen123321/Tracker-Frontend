import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api', // Make sure your .env has VITE_API_URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  // Notice: withCredentials is gone! Everything else stays exactly the same.
});

// 1. Request Interceptor: Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cims_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. Response Interceptor: Redirect to login if token expires (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the URL that failed was the login URL
    const isLoginRequest = error.config?.url?.includes('/login');
    
    // Only force a reload if it's a 401 AND we aren't trying to log in
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('cims_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;