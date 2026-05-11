// ─── DATA INTERFACES ───
export interface Branch {
    id?: number | string;
    name: string;
    address?: string;
    latitude: number | string;
    longitude: number | string;
    radius?: number | string;
}

export interface BranchState {
    branches: Branch[];
    loading: boolean;
    isSubmitting: boolean;
    error: string | null;
}

// ─── ACTION TYPE CONSTANTS ───
export const FETCH_BRANCHES_REQUEST = 'FETCH_BRANCHES_REQUEST';
export const FETCH_BRANCHES_SUCCESS = 'FETCH_BRANCHES_SUCCESS';
export const FETCH_BRANCHES_FAILURE = 'FETCH_BRANCHES_FAILURE';

export const ADD_BRANCH_REQUEST = 'ADD_BRANCH_REQUEST';
export const ADD_BRANCH_SUCCESS = 'ADD_BRANCH_SUCCESS';
export const ADD_BRANCH_FAILURE = 'ADD_BRANCH_FAILURE';

export const UPDATE_BRANCH_REQUEST = 'UPDATE_BRANCH_REQUEST';
export const UPDATE_BRANCH_SUCCESS = 'UPDATE_BRANCH_SUCCESS';
export const UPDATE_BRANCH_FAILURE = 'UPDATE_BRANCH_FAILURE';

export const DELETE_BRANCH_REQUEST = 'DELETE_BRANCH_REQUEST';
export const DELETE_BRANCH_SUCCESS = 'DELETE_BRANCH_SUCCESS';
export const DELETE_BRANCH_FAILURE = 'DELETE_BRANCH_FAILURE';