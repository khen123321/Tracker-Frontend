import * as types from './types';

// ─── LOGIN ───
export const loginRequest = (payload: types.LoginPayload) => ({
    type: types.LOGIN_REQUEST,
    payload,
});

export const loginSuccess = (payload: { user: types.User; token: string }) => ({
    type: types.LOGIN_SUCCESS,
    payload,
});

export const loginFailure = (error: string) => ({
    type: types.LOGIN_FAILURE,
    payload: error,
});

// ─── LOGOUT ───
export const logoutRequest = () => ({
    type: types.LOGOUT_REQUEST,
});

export const logoutSuccess = () => ({
    type: types.LOGOUT_SUCCESS,
});

// ─── UPDATE USER INFO ───
export const updateUserRequest = (payload: Partial<types.User>) => ({
    type: types.UPDATE_USER_REQUEST,
    payload,
});

export const updateUserSuccess = (payload: Partial<types.User>) => ({
    type: types.UPDATE_USER_SUCCESS,
    payload,
});