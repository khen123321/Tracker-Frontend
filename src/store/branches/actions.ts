import * as types from './types';

// ─── FETCH ───
export const fetchBranchesRequest = () => ({ type: types.FETCH_BRANCHES_REQUEST });
export const fetchBranchesSuccess = (branches: types.Branch[]) => ({ type: types.FETCH_BRANCHES_SUCCESS, payload: branches });
export const fetchBranchesFailure = (error: string) => ({ type: types.FETCH_BRANCHES_FAILURE, payload: error });

// ─── ADD ───
export const addBranchRequest = (branch: types.Branch) => ({ type: types.ADD_BRANCH_REQUEST, payload: branch });
export const addBranchSuccess = (branch: types.Branch) => ({ type: types.ADD_BRANCH_SUCCESS, payload: branch });
export const addBranchFailure = (error: string) => ({ type: types.ADD_BRANCH_FAILURE, payload: error });

// ─── UPDATE ───
export const updateBranchRequest = (id: number | string, data: Partial<types.Branch>) => ({ type: types.UPDATE_BRANCH_REQUEST, payload: { id, data } });
export const updateBranchSuccess = (branch: types.Branch) => ({ type: types.UPDATE_BRANCH_SUCCESS, payload: branch });
export const updateBranchFailure = (error: string) => ({ type: types.UPDATE_BRANCH_FAILURE, payload: error });

// ─── DELETE ───
export const deleteBranchRequest = (id: number | string) => ({ type: types.DELETE_BRANCH_REQUEST, payload: id });
export const deleteBranchSuccess = (id: number | string) => ({ type: types.DELETE_BRANCH_SUCCESS, payload: id });
export const deleteBranchFailure = (error: string) => ({ type: types.DELETE_BRANCH_FAILURE, payload: error });