// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';

// Import all your slice reducers
import drawerReducer from './slices/drawerSlice';
import authReducer from './slices/authSlice';
import toastReducer from './slices/toastSlice';
import filterReducer from './slices/filterSlice';

export const store = configureStore({
  reducer: {
    // Register all reducers here
    drawer: drawerReducer,
    auth: authReducer,
    notifications: toastReducer,
    filters: filterReducer,
  },
});

// Export types so TypeScript knows exactly what your state looks like
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;