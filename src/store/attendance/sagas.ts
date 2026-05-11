import { call, put, select, takeLatest } from 'redux-saga/effects';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as types from './types';
import * as actions from './actions';
import { RootState } from '../index'; // Adjust path if your RootState is elsewhere

// ─── 1. SYNC SERVER TIME SAGA ───
function* syncServerTimeSaga(): any {
    try {
        const requestTime = Date.now(); 
        const response = yield call(api.get, '/server-time');
        const responseTime = Date.now();
        
        // Calculate exact network latency
        const networkLatency = (responseTime - requestTime) / 2;
        const trueServerTime = response.data.timestamp + networkLatency;
        const offset = trueServerTime - Date.now();

        yield put(actions.syncServerTimeSuccess(offset));
    } catch (error: any) {
        console.error("Could not sync server time", error);
        yield put(actions.syncServerTimeFailure('Failed to sync server time'));
        // Optional: yield call(toast.error, "Network Error: Could not sync with Server Time.");
    }
}

// ─── 2. FETCH ASSIGNED BRANCH SAGA ───
function* fetchAssignedBranchSaga(): any {
    try {
        // We fetch the user's profile to get their assigned branch
        const response = yield call(api.get, '/auth/me');
        const branch = response.data?.intern?.branch;

        if (branch) {
            yield put(actions.fetchAssignedBranchSuccess(branch));
        } else {
            throw new Error("No branch assigned to this intern.");
        }
    } catch (error: any) {
        console.error("Could not fetch branch data", error);
        yield put(actions.fetchAssignedBranchFailure(error.message || 'Failed to fetch branch'));
    }
}

// ─── 3. FETCH TODAY'S LOG SAGA ───
function* fetchTodayLogSaga(): any {
    try {
        const response = yield call(api.get, '/attendance/history');
        const logs: types.AttendanceLog[] = response.data || [];
        
        // ✨ Get the serverTimeOffset directly from the Redux store to calculate "today" correctly!
        const timeOffset = yield select((state: RootState) => state.attendance.serverTimeOffset);
        const todayYMD = new Date(Date.now() + timeOffset).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

        const todayRecord = logs.find((log: any) => {
            try {
                const logDateStr = log.raw_date || log.date || log.created_at || '';
                const logYMD = new Date(logDateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                return logYMD === todayYMD;
            } catch  {
                return false; 
            }
        });

        yield put(actions.fetchTodayLogSuccess(todayRecord || null));
    } catch (error: any) {
        console.error("Failed to fetch today's log", error);
        yield put(actions.fetchTodayLogFailure(error.message || "Failed to fetch logs"));
    }
}

// ─── 4. SUBMIT ATTENDANCE SAGA ───
function* submitAttendanceSaga(action: any): any {
    // Start a loading toast
    const loadingToastId = toast.loading("Logging attendance...");

    try {
        const response = yield call(api.post, '/attendance/log', action.payload);
        const msg = response.data?.message || "Attendance logged!";

        // Check if the server returned a warning (like a late punch) or a success
        if (msg.includes('⚠️')) {
            yield call(toast, msg, { 
                id: loadingToastId, 
                icon: '⚠️', 
                duration: 6000, 
                style: { background: '#FEF08A', color: '#854D0E', fontWeight: 'bold' } 
            });
        } else {
            yield call(toast.success, msg, { id: loadingToastId, duration: 6000 });
        }

        // 1. Tell the reducer we finished submitting
        yield put(actions.submitAttendanceSuccess());
        
        // 2. ✨ AUTOMATICALLY refresh today's log so the UI locks the button instantly!
        yield put(actions.fetchTodayLogRequest());

    } catch (error: any) {
        const errorMsg = error.response?.data?.message || "Submission failed";
        yield call(toast.error, errorMsg, { id: loadingToastId });
        yield put(actions.submitAttendanceFailure(errorMsg));
    }
}

// ─── WATCHER SAGA ───
export function* watchAttendanceSagas() {
    yield takeLatest(types.SYNC_SERVER_TIME_REQUEST, syncServerTimeSaga);
    yield takeLatest(types.FETCH_ASSIGNED_BRANCH_REQUEST, fetchAssignedBranchSaga);
    yield takeLatest(types.FETCH_TODAY_LOG_REQUEST, fetchTodayLogSaga);
    yield takeLatest(types.SUBMIT_ATTENDANCE_REQUEST, submitAttendanceSaga);
}