import * as types from './types';

export const fetchProgramsRequest = () => ({ type: types.FETCH_PROGRAMS_REQUEST });
export const fetchProgramsSuccess = (schools: types.School[]) => ({ type: types.FETCH_PROGRAMS_SUCCESS, payload: schools });
export const fetchProgramsFailure = (error: string) => ({ type: types.FETCH_PROGRAMS_FAILURE, payload: error });

export const addSchoolRequest = (school: types.School) => ({ type: types.ADD_SCHOOL_REQUEST, payload: school });
export const addSchoolSuccess = (school: types.School) => ({ type: types.ADD_SCHOOL_SUCCESS, payload: school });

export const addCourseRequest = (course: types.Course) => ({ type: types.ADD_COURSE_REQUEST, payload: course });
export const addCourseSuccess = (course: types.Course) => ({ type: types.ADD_COURSE_SUCCESS, payload: course });

export const deleteSchoolRequest = (id: number | string) => ({ type: types.DELETE_SCHOOL_REQUEST, payload: id });
export const deleteSchoolSuccess = (id: number | string) => ({ type: types.DELETE_SCHOOL_SUCCESS, payload: id });