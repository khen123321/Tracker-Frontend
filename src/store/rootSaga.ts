// src/store/rootSaga.ts
import { all } from 'redux-saga/effects';

import { watchAuthSagas } from './auth/sagas';
import { watchDepartmentSagas } from './departments/sagas';
import { watchAttendanceSagas } from './attendance/sagas';
import { watchBranchSagas } from './branches/sagas'; 
import { watchProgramSagas } from './programs/sagas'; 

export default function* rootSaga() {
  yield all([
    watchAuthSagas(),
    watchDepartmentSagas(),
    watchAttendanceSagas(),
    watchBranchSagas(), 
    watchProgramSagas(), 
  ]);
}