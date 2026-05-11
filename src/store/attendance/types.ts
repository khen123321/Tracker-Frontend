// ─── DATA INTERFACES ───
export interface Branch {
    name: string;
    latitude: number;
    longitude: number;
    radius?: number;
}

export interface AttendanceLog {
    time_in_am?: string | null;
    time_out_am?: string | null;
    time_in_pm?: string | null;
    time_out_pm?: string | null;
    am_in_status?: string;
    lunch_out_status?: string;
    lunch_in_status?: string;
    pm_out_status?: string;
    raw_date?: string;
    date?: string;
    created_at?: string;
}

export interface SubmitAttendancePayload {
    type: string;
    lat: number | null;
    lng: number | null;
    image: string | null;
}

export interface AttendanceState {
    todayLog: AttendanceLog | null;
    assignedBranch: Branch | null;
    serverTimeOffset: number;
    loading: boolean;
    isSubmitting: boolean;
    error: string | null;
}

// ─── ACTION TYPE CONSTANTS ───

// 1. Server Time
export const SYNC_SERVER_TIME_REQUEST = 'SYNC_SERVER_TIME_REQUEST';
export const SYNC_SERVER_TIME_SUCCESS = 'SYNC_SERVER_TIME_SUCCESS';
export const SYNC_SERVER_TIME_FAILURE = 'SYNC_SERVER_TIME_FAILURE';

// 2. Fetch Today's Log
export const FETCH_TODAY_LOG_REQUEST = 'FETCH_TODAY_LOG_REQUEST';
export const FETCH_TODAY_LOG_SUCCESS = 'FETCH_TODAY_LOG_SUCCESS';
export const FETCH_TODAY_LOG_FAILURE = 'FETCH_TODAY_LOG_FAILURE';

// 3. Fetch Assigned Branch
export const FETCH_ASSIGNED_BRANCH_REQUEST = 'FETCH_ASSIGNED_BRANCH_REQUEST';
export const FETCH_ASSIGNED_BRANCH_SUCCESS = 'FETCH_ASSIGNED_BRANCH_SUCCESS';
export const FETCH_ASSIGNED_BRANCH_FAILURE = 'FETCH_ASSIGNED_BRANCH_FAILURE';

// 4. Submit Attendance
export const SUBMIT_ATTENDANCE_REQUEST = 'SUBMIT_ATTENDANCE_REQUEST';
export const SUBMIT_ATTENDANCE_SUCCESS = 'SUBMIT_ATTENDANCE_SUCCESS';
export const SUBMIT_ATTENDANCE_FAILURE = 'SUBMIT_ATTENDANCE_FAILURE';