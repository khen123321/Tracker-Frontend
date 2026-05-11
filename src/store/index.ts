import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

// ─── 1. UI REDUCERS (Synchronous Redux Toolkit) ───
import drawerReducer from './ui/drawerReducer';
import toastReducer from './ui/toastReducer';
import filterReducer from './ui/filterReducer';

// ─── 2. FEATURE REDUCERS (Classic Redux with Sagas) ───
import { authReducer } from './auth/reducer';
import { departmentReducer } from './departments/reducer';
import { attendanceReducer } from './attendance/reducer';
import { branchReducer } from './branches/reducer'; 
import { programReducer } from './programs/reducer'; 

// ─── 3. ROOT SAGA ───
import rootSaga from './rootSaga';

// Create the Saga middleware
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    // UI State
    drawer: drawerReducer,
    notifications: toastReducer,
    filters: filterReducer,
    
    // Feature State
    auth: authReducer,
    departments: departmentReducer,
    attendance: attendanceReducer,
    branches: branchReducer, 
    programs: programReducer, 
  },
  // Add the saga middleware and disable thunk (since we are using Saga instead)
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

// Run the root saga to start listening for actions
sagaMiddleware.run(rootSaga);

// Export types so TypeScript knows exactly what your state looks like
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;