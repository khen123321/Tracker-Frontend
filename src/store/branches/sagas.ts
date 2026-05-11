import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as types from './types';
import * as actions from './actions';

// ─── FETCH SAGAS ───
function* fetchBranchesSaga(): any {
    try {
        const response = yield call(api.get, '/hr/settings/branches'); // Adjust endpoint if needed
        yield put(actions.fetchBranchesSuccess(response.data));
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Failed to fetch branches';
        yield put(actions.fetchBranchesFailure(msg));
        toast.error(msg);
    }
}

// ─── ADD SAGA ───
function* addBranchSaga(action: any): any {
    const toastId = toast.loading('Adding branch...');
    try {
        const response = yield call(api.post, '/hr/settings/branches', action.payload);
        yield put(actions.addBranchSuccess(response.data.branch || response.data));
        toast.success('Branch added successfully!', { id: toastId });
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Failed to add branch';
        yield put(actions.addBranchFailure(msg));
        toast.error(msg, { id: toastId });
    }
}

// ─── UPDATE SAGA ───
function* updateBranchSaga(action: any): any {
    const toastId = toast.loading('Updating branch...');
    try {
        const { id, data } = action.payload;
        const response = yield call(api.put, `/hr/settings/branches/${id}`, data);
        yield put(actions.updateBranchSuccess(response.data.branch || response.data));
        toast.success('Branch updated successfully!', { id: toastId });
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Failed to update branch';
        yield put(actions.updateBranchFailure(msg));
        toast.error(msg, { id: toastId });
    }
}

// ─── DELETE SAGA ───
function* deleteBranchSaga(action: any): any {
    const toastId = toast.loading('Deleting branch...');
    try {
        yield call(api.delete, `/hr/settings/branches/${action.payload}`);
        yield put(actions.deleteBranchSuccess(action.payload));
        toast.success('Branch deleted successfully!', { id: toastId });
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Failed to delete branch';
        yield put(actions.deleteBranchFailure(msg));
        toast.error(msg, { id: toastId });
    }
}

// ─── WATCHER ───
export function* watchBranchSagas() {
    yield takeLatest(types.FETCH_BRANCHES_REQUEST, fetchBranchesSaga);
    yield takeLatest(types.ADD_BRANCH_REQUEST, addBranchSaga);
    yield takeLatest(types.UPDATE_BRANCH_REQUEST, updateBranchSaga);
    yield takeLatest(types.DELETE_BRANCH_REQUEST, deleteBranchSaga);
}