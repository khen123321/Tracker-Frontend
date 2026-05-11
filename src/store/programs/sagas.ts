import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as types from './types';
import * as actions from './actions';

function* fetchProgramsSaga(): any {
    try {
        const response = yield call(api.get, '/hr/settings/schools');
        yield put(actions.fetchProgramsSuccess(response.data));
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Failed to load schools';
        yield put(actions.fetchProgramsFailure(msg));
    }
}

function* addSchoolSaga(action: any): any {
    const tid = toast.loading('Adding school...');
    try {
        const response = yield call(api.post, '/hr/settings/schools', action.payload);
        yield put(actions.addSchoolSuccess(response.data));
        toast.success('School added!', { id: tid });
    } catch (error: any) {
        toast.error('Error adding school', { id: tid });
    }
}

function* addCourseSaga(action: any): any {
    const tid = toast.loading('Adding course...');
    try {
        const response = yield call(api.post, '/hr/settings/courses', action.payload);
        yield put(actions.addCourseSuccess(response.data));
        toast.success('Course and hours saved!', { id: tid });
    } catch (error: any) {
        toast.error('Error adding course', { id: tid });
    }
}

export function* watchProgramSagas() {
    yield takeLatest(types.FETCH_PROGRAMS_REQUEST, fetchProgramsSaga);
    yield takeLatest(types.ADD_SCHOOL_REQUEST, addSchoolSaga);
    yield takeLatest(types.ADD_COURSE_REQUEST, addCourseSaga);
}