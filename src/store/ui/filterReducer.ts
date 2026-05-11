import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define all the filters used in your InternsList
interface FilterState {
  searchTerm: string;
  deptFilter: string;
  schoolFilter: string;
  statusFilter: string;
  presentFilter: string;
  viewMode: 'active' | 'archived';
}

const initialState: FilterState = {
  searchTerm: '',
  deptFilter: 'All',
  schoolFilter: 'All',
  statusFilter: 'All',
  presentFilter: 'All',
  viewMode: 'active',
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setDeptFilter: (state, action: PayloadAction<string>) => {
      state.deptFilter = action.payload;
    },
    setSchoolFilter: (state, action: PayloadAction<string>) => {
      state.schoolFilter = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    setPresentFilter: (state, action: PayloadAction<string>) => {
      state.presentFilter = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'active' | 'archived'>) => {
      state.viewMode = action.payload;
    },
    // Useful for clearing all filters at once
    resetFilters: (state) => {
      return initialState;
    }
  },
});

export const { 
  setSearchTerm, setDeptFilter, setSchoolFilter, 
  setStatusFilter, setPresentFilter, setViewMode, resetFilters 
} = filterSlice.actions;
export default filterSlice.reducer;