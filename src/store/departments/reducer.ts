import * as types from './types';

const initialState: types.DepartmentState = {
  departments: [],
  loading: false,
  isSubmitting: false,
  error: null,
};

export const departmentReducer = (state = initialState, action: any): types.DepartmentState => {
  switch (action.type) {
    case types.FETCH_DEPARTMENTS_REQUEST:
      return { ...state, loading: true, error: null };
    case types.FETCH_DEPARTMENTS_SUCCESS:
      return { ...state, loading: false, departments: action.payload };
    case types.FETCH_DEPARTMENTS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case types.ADD_DEPARTMENT_REQUEST:
      return { ...state, isSubmitting: true, error: null };
    case types.ADD_DEPARTMENT_SUCCESS:
      return { ...state, isSubmitting: false, departments: [...state.departments, action.payload] };
    case types.ADD_DEPARTMENT_FAILURE:
      return { ...state, isSubmitting: false, error: action.payload };

    case types.DELETE_DEPARTMENT_REQUEST:
      return { ...state, error: null };
    case types.DELETE_DEPARTMENT_SUCCESS:
      return { ...state, departments: state.departments.filter(dept => dept.id !== action.payload) };
    case types.DELETE_DEPARTMENT_FAILURE:
      return { ...state, error: action.payload };

    default:
      return state;
  }
};