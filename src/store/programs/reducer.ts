import * as types from './types';

const initialState: types.ProgramState = {
    schools: [],
    loading: false,
    isSubmitting: false,
    error: null,
};

export const programReducer = (state = initialState, action: any): types.ProgramState => {
    switch (action.type) {
        case types.FETCH_PROGRAMS_REQUEST:
            return { ...state, loading: true, error: null };
            
        case types.FETCH_PROGRAMS_SUCCESS:
            return { ...state, loading: false, schools: action.payload };
            
        case types.FETCH_PROGRAMS_FAILURE:
            return { ...state, loading: false, error: action.payload };
        
        case types.ADD_SCHOOL_SUCCESS:
            return { ...state, schools: [...state.schools, action.payload] };

        case types.ADD_COURSE_SUCCESS:
            return {
                ...state,
                schools: state.schools.map(school => 
                    school.id == action.payload.school_id 
                    ? { ...school, courses: [...(school.courses || []), action.payload] }
                    : school
                )
            };

        case types.DELETE_SCHOOL_SUCCESS:
            return { ...state, schools: state.schools.filter(s => s.id !== action.payload) };

        default:
            return state;
    }
};