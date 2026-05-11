import * as types from './types';

const initialState: types.BranchState = {
    branches: [],
    loading: false,
    isSubmitting: false,
    error: null,
};

export const branchReducer = (state = initialState, action: any): types.BranchState => {
    switch (action.type) {
        // ─── FETCH ───
        case types.FETCH_BRANCHES_REQUEST:
            return { ...state, loading: true, error: null };
        case types.FETCH_BRANCHES_SUCCESS:
            return { ...state, loading: false, branches: action.payload };
        case types.FETCH_BRANCHES_FAILURE:
            return { ...state, loading: false, error: action.payload };

        // ─── SUBMITTING (Add, Update, Delete) ───
        case types.ADD_BRANCH_REQUEST:
        case types.UPDATE_BRANCH_REQUEST:
        case types.DELETE_BRANCH_REQUEST:
            return { ...state, isSubmitting: true, error: null };

        case types.ADD_BRANCH_FAILURE:
        case types.UPDATE_BRANCH_FAILURE:
        case types.DELETE_BRANCH_FAILURE:
            return { ...state, isSubmitting: false, error: action.payload };

        // ─── SUCCESS HANDLERS (Instantly update UI) ───
        case types.ADD_BRANCH_SUCCESS:
            return { 
                ...state, 
                isSubmitting: false, 
                branches: [...state.branches, action.payload] 
            };
            
        case types.UPDATE_BRANCH_SUCCESS:
            return {
                ...state,
                isSubmitting: false,
                branches: state.branches.map(branch => 
                    branch.id === action.payload.id ? action.payload : branch
                )
            };

        case types.DELETE_BRANCH_SUCCESS:
            return {
                ...state,
                isSubmitting: false,
                branches: state.branches.filter(branch => branch.id !== action.payload)
            };

        default:
            return state;
    }
};