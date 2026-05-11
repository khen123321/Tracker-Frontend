// ─── DATA INTERFACES ───
export interface Course {
    id?: number | string;
    school_id: number | string;
    course_name: string;
    required_hours: number; 
}

export interface School {
    id?: number | string;
    name: string;
    address?: string;
    courses?: Course[];
}

export interface ProgramState {
    schools: School[];
    loading: boolean;
    isSubmitting: boolean;
    error: string | null;
}

// ─── ACTION TYPE CONSTANTS ───
export const FETCH_PROGRAMS_REQUEST = 'FETCH_PROGRAMS_REQUEST';
export const FETCH_PROGRAMS_SUCCESS = 'FETCH_PROGRAMS_SUCCESS';
export const FETCH_PROGRAMS_FAILURE = 'FETCH_PROGRAMS_FAILURE';

export const ADD_SCHOOL_REQUEST = 'ADD_SCHOOL_REQUEST';
export const ADD_SCHOOL_SUCCESS = 'ADD_SCHOOL_SUCCESS';

export const ADD_COURSE_REQUEST = 'ADD_COURSE_REQUEST';
export const ADD_COURSE_SUCCESS = 'ADD_COURSE_SUCCESS';

export const DELETE_SCHOOL_REQUEST = 'DELETE_SCHOOL_REQUEST';
export const DELETE_SCHOOL_SUCCESS = 'DELETE_SCHOOL_SUCCESS';