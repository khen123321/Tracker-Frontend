import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as types from './types';
import * as actions from './actions';

// ─── 1. LOGIN SAGA ───
function* loginSaga(action: any): any {
    const loadingToastId = toast.loading('Logging in...');
    try {
        const response = yield call(api.post, '/auth/login', action.payload);
        
        // ✨ THE FIX: Safely extract user and token, accounting for different Laravel response structures
        const userData = response.data.user || response.data.data?.user;
        const authToken = response.data.token || response.data.access_token || response.data.data?.token;

        if (!authToken) {
            throw new Error("No token received from the server!");
        }

        // Persist to local storage immediately
        localStorage.setItem('cims_token', authToken);
        localStorage.setItem('cims_user', JSON.stringify(userData));

        // Update Redux state
        yield put(actions.loginSuccess({ user: userData, token: authToken }));
        yield call(toast.success, 'Successfully logged in!', { id: loadingToastId });
        
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
        yield put(actions.loginFailure(errorMsg));
        yield call(toast.error, errorMsg, { id: loadingToastId });
    }
}

// ─── 2. LOGOUT SAGA ───
function* logoutSaga(): any {
    try {
        // Optional: If you have a backend route to invalidate tokens, call it here:
        // yield call(api.post, '/auth/logout');
        
        // Clear local storage
        localStorage.removeItem('cims_token');
        localStorage.removeItem('cims_user');

        yield put(actions.logoutSuccess());
        
    } catch (error) {
        console.error('Logout error', error);
    }
}

// ─── 3. UPDATE USER SAGA ───
function* updateUserSaga(action: any): any {
    try {
        // Read the current user to merge the updates safely
        const currentUserRaw = localStorage.getItem('cims_user');
        if (currentUserRaw) {
            const currentUser = JSON.parse(currentUserRaw);
            const updatedUser = { ...currentUser, ...action.payload };
            
            localStorage.setItem('cims_user', JSON.stringify(updatedUser));
            yield put(actions.updateUserSuccess(action.payload));
        }
    } catch (error) {
        console.error('Update user error', error);
    }
}

// ─── WATCHER SAGA ───
export function* watchAuthSagas() {
    yield takeLatest(types.LOGIN_REQUEST, loginSaga);
    yield takeLatest(types.LOGOUT_REQUEST, logoutSaga);
    yield takeLatest(types.UPDATE_USER_REQUEST, updateUserSaga);
}