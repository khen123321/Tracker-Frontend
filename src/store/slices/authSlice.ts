import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the shape of your user object
interface User {
  id: number | string;
  name: string;
  email: string;
  role: 'superadmin' | 'hr' | 'hr_intern' | 'intern' | string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Check local storage on initial load
const storedToken = localStorage.getItem('cims_token');
// You might also store user info in localStorage, or fetch it on app load
const storedUser = localStorage.getItem('cims_user') ? JSON.parse(localStorage.getItem('cims_user') as string) : null;

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!storedToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      // Persist to local storage
      localStorage.setItem('cims_token', action.payload.token);
      localStorage.setItem('cims_user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      // Clear from local storage
      localStorage.removeItem('cims_token');
      localStorage.removeItem('cims_user');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('cims_user', JSON.stringify(state.user));
      }
    }
  },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;