import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as types from './types';
import * as actions from './actions';

function* fetchDepartmentsSaga(): any {
  try {
    const response = yield call(api.get, '/hr/settings/departments');
    yield put(actions.fetchDepartmentsSuccess(response.data));
  } catch (error: any) {
    yield put(actions.fetchDepartmentsFailure(error.message));
    toast.error('Failed to load departments');
  }
}

function* addDepartmentSaga(action: any): any {
  const tid = toast.loading('Adding department...');
  try {
    const response = yield call(api.post, '/hr/settings/departments', action.payload);
    yield put(actions.addDepartmentSuccess(response.data));
    toast.success('Department added successfully!', { id: tid });
  } catch (error: any) {
    yield put(actions.addDepartmentFailure(error.message));
    toast.error(error.response?.data?.message || 'Error adding department', { id: tid });
  }
}

function* deleteDepartmentSaga(action: any): any {
  const tid = toast.loading('Deleting department...');
  try {
    yield call(api.delete, `/hr/settings/departments/${action.payload}`);
    yield put(actions.deleteDepartmentSuccess(action.payload));
    toast.success('Department deleted!', { id: tid });
  } catch (error: any) {
    yield put(actions.deleteDepartmentFailure(error.message));
    toast.error('Failed to delete department', { id: tid });
  }
}

export function* watchDepartmentSagas() {
  yield takeLatest(types.FETCH_DEPARTMENTS_REQUEST, fetchDepartmentsSaga);
  yield takeLatest(types.ADD_DEPARTMENT_REQUEST, addDepartmentSaga);
  yield takeLatest(types.DELETE_DEPARTMENT_REQUEST, deleteDepartmentSaga);
}