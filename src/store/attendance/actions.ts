import * as types from './types';

// ─── 1. SYNC SERVER TIME ───
export const syncServerTimeRequest = () => ({
    type: types.SYNC_SERVER_TIME_REQUEST
});

export const syncServerTimeSuccess = (offset: number) => ({
    type: types.SYNC_SERVER_TIME_SUCCESS,
    payload: offset
});

export const syncServerTimeFailure = (error: string) => ({
    type: types.SYNC_SERVER_TIME_FAILURE,
    payload: error
});

// ─── 2. FETCH TODAY'S LOG ───
export const fetchTodayLogRequest = () => ({
    type: types.FETCH_TODAY_LOG_REQUEST
});

export const fetchTodayLogSuccess = (log: types.AttendanceLog | null) => ({
    type: types.FETCH_TODAY_LOG_SUCCESS,
    payload: log
});

export const fetchTodayLogFailure = (error: string) => ({
    type: types.FETCH_TODAY_LOG_FAILURE,
    payload: error
});

// ─── 3. FETCH ASSIGNED BRANCH ───
export const fetchAssignedBranchRequest = () => ({
    type: types.FETCH_ASSIGNED_BRANCH_REQUEST
});

export const fetchAssignedBranchSuccess = (branch: types.Branch) => ({
    type: types.FETCH_ASSIGNED_BRANCH_SUCCESS,
    payload: branch
});

export const fetchAssignedBranchFailure = (error: string) => ({
    type: types.FETCH_ASSIGNED_BRANCH_FAILURE,
    payload: error
});

// ─── 4. SUBMIT ATTENDANCE ───
export const submitAttendanceRequest = (payload: types.SubmitAttendancePayload) => ({
    type: types.SUBMIT_ATTENDANCE_REQUEST,
    payload
});

export const submitAttendanceSuccess = () => ({
    type: types.SUBMIT_ATTENDANCE_SUCCESS
});

export const submitAttendanceFailure = (error: string) => ({
    type: types.SUBMIT_ATTENDANCE_FAILURE,
    payload: error
});