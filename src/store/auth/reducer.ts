import * as types from './types';

// ✨ Safely retrieve data from local storage
const getStoredToken = () => localStorage.getItem('cims_token');

const getStoredUser = () => {
    try {
        const user = localStorage.getItem('cims_user');
        return user ? JSON.parse(user) : null;
    } catch {
        // Clear storage if JSON is malformed to prevent infinite crashes
        localStorage.removeItem('cims_user');
        return null;
    }
};

const initialUser = getStoredUser();
const initialToken = getStoredToken();

const initialState: types.AuthState = {
    user: initialUser,
    token: initialToken,
    // ✨ FIX: Only set true if WE HAVE BOTH. 
    // This prevents components from crashing when they expect a user object.
    isAuthenticated: !!(initialToken && initialUser), 
    loading: false,
    error: null,
};

export const authReducer = (state = initialState, action: any): types.AuthState => {
    switch (action.type) {
        case types.LOGIN_REQUEST:
            return { ...state, loading: true, error: null };
            
        case types.LOGIN_SUCCESS:
            return {
                ...state,
                loading: false,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                error: null
            };
            
        case types.LOGIN_FAILURE:
            return { ...state, loading: false, error: action.payload };

        case types.LOGOUT_SUCCESS:
            // Reset to a clean empty state
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false,
                error: null
            };

        case types.UPDATE_USER_SUCCESS:
            if (state.user) {
                const updatedUser = { ...state.user, ...action.payload };
                // Keep local storage in sync when user data changes (e.g., profile pic update)
                localStorage.setItem('cims_user', JSON.stringify(updatedUser));
                return {
                    ...state,
                    user: updatedUser,
                };
            }
            return state;

        default:
            return state;
    }
};