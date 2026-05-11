export interface Department {
  id: number;
  name: string;
  supervisor_name: string;
}

export interface DepartmentState {
  departments: Department[];
  loading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

// Action Types
export const FETCH_DEPARTMENTS_REQUEST = 'FETCH_DEPARTMENTS_REQUEST';
export const FETCH_DEPARTMENTS_SUCCESS = 'FETCH_DEPARTMENTS_SUCCESS';
export const FETCH_DEPARTMENTS_FAILURE = 'FETCH_DEPARTMENTS_FAILURE';

export const ADD_DEPARTMENT_REQUEST = 'ADD_DEPARTMENT_REQUEST';
export const ADD_DEPARTMENT_SUCCESS = 'ADD_DEPARTMENT_SUCCESS';
export const ADD_DEPARTMENT_FAILURE = 'ADD_DEPARTMENT_FAILURE';

export const DELETE_DEPARTMENT_REQUEST = 'DELETE_DEPARTMENT_REQUEST';
export const DELETE_DEPARTMENT_SUCCESS = 'DELETE_DEPARTMENT_SUCCESS';
export const DELETE_DEPARTMENT_FAILURE = 'DELETE_DEPARTMENT_FAILURE';