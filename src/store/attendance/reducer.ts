import * as types from './types';

const initialState: types.AttendanceState = {
    todayLog: null,
    assignedBranch: null,
    serverTimeOffset: 0,
    loading: false,
    isSubmitting: false,
    error: null
};

export const attendanceReducer = (state = initialState, action: any): types.AttendanceState => {
    switch (action.type) {
        // ─── 1. SYNC SERVER TIME ───
        case types.SYNC_SERVER_TIME_REQUEST:
            return { ...state, error: null };
        case types.SYNC_SERVER_TIME_SUCCESS:
            return { ...state, serverTimeOffset: action.payload };
        case types.SYNC_SERVER_TIME_FAILURE:
            return { ...state, error: action.payload };

        // ─── 2. FETCH TODAY'S LOG ───
        case types.FETCH_TODAY_LOG_REQUEST:
            return { ...state, loading: true, error: null };
        case types.FETCH_TODAY_LOG_SUCCESS:
            return { ...state, loading: false, todayLog: action.payload };
        case types.FETCH_TODAY_LOG_FAILURE:
            return { ...state, loading: false, error: action.payload };

        // ─── 3. FETCH ASSIGNED BRANCH ───
        case types.FETCH_ASSIGNED_BRANCH_REQUEST:
            return { ...state, loading: true, error: null };
        case types.FETCH_ASSIGNED_BRANCH_SUCCESS:
            return { ...state, loading: false, assignedBranch: action.payload };
        case types.FETCH_ASSIGNED_BRANCH_FAILURE:
            return { ...state, loading: false, error: action.payload };

        // ─── 4. SUBMIT ATTENDANCE ───
        case types.SUBMIT_ATTENDANCE_REQUEST:
            return { ...state, isSubmitting: true, error: null };
        case types.SUBMIT_ATTENDANCE_SUCCESS:
            // On success, we just turn off the submitting spinner. 
            // The Saga will automatically trigger FETCH_TODAY_LOG_REQUEST to update the log!
            return { ...state, isSubmitting: false };
        case types.SUBMIT_ATTENDANCE_FAILURE:
            return { ...state, isSubmitting: false, error: action.payload };

        default:
            return state;
    }
};