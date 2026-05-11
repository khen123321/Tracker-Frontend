// ─── DATA INTERFACES ───
export interface User {
    id: number | string;
    name: string;
    email: string;
    first_name?: string; 
    last_name?: string;  
    role: 'superadmin' | 'hr' | 'hr_intern' | 'intern' | string;
    branch?: any; // Useful since your interns have assigned branches
    permissions?: string[];
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface LoginPayload {
    email?: string;
    password?: string;
    [key: string]: any; // In case you use username or other fields
}

// ─── ACTION TYPE CONSTANTS ───
export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';

export const LOGOUT_REQUEST = 'LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';

export const UPDATE_USER_REQUEST = 'UPDATE_USER_REQUEST';
export const UPDATE_USER_SUCCESS = 'UPDATE_USER_SUCCESS';