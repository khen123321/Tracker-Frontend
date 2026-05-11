// src/store/slices/drawerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DrawerState {
  internId: string | number | null;
  isOpen: boolean;
}

const initialState: DrawerState = {
  internId: null,
  isOpen: false,
};

const drawerSlice = createSlice({
  name: 'drawer',
  initialState,
  reducers: {
    openProfile: (state, action: PayloadAction<string | number>) => {
      state.internId = action.payload;
      state.isOpen = true;
    },
    closeProfile: (state) => {
      state.internId = null;
      state.isOpen = false;
    },
  },
});

export const { openProfile, closeProfile } = drawerSlice.actions;
export default drawerSlice.reducer;