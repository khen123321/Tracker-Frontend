import * as types from './types';

// Fetch
export const fetchDepartments = () => ({ type: types.FETCH_DEPARTMENTS_REQUEST });
export const fetchDepartmentsSuccess = (departments: types.Department[]) => ({ type: types.FETCH_DEPARTMENTS_SUCCESS, payload: departments });
export const fetchDepartmentsFailure = (error: string) => ({ type: types.FETCH_DEPARTMENTS_FAILURE, payload: error });

// Add
export const addDepartment = (data: { name: string; supervisor_name: string }) => ({ type: types.ADD_DEPARTMENT_REQUEST, payload: data });
export const addDepartmentSuccess = (department: types.Department) => ({ type: types.ADD_DEPARTMENT_SUCCESS, payload: department });
export const addDepartmentFailure = (error: string) => ({ type: types.ADD_DEPARTMENT_FAILURE, payload: error });

// Delete
export const deleteDepartment = (id: number) => ({ type: types.DELETE_DEPARTMENT_REQUEST, payload: id });
export const deleteDepartmentSuccess = (id: number) => ({ type: types.DELETE_DEPARTMENT_SUCCESS, payload: id });
export const deleteDepartmentFailure = (error: string) => ({ type: types.DELETE_DEPARTMENT_FAILURE, payload: error });