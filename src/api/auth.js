// src/api/auth.js
import api from './axios';

export const login = async (email, password, role) => {
  const response = await api.post('/auth/login', { 
    email, 
    password, 
    role 
  });
  return response.data;
};

export const logout = async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('cims_token');
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};