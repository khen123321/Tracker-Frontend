// src/components/GlobalDrawer.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeProfile } from '../store/ui/drawerReducer';
import InternProfileDrawer from './InternProfileDrawer'; // Adjust this path if needed
import { RootState, AppDispatch } from '../store';

export const GlobalDrawer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { internId, isOpen } = useSelector((state: RootState) => state.drawer);

  if (!isOpen || !internId) return null;

  return (
    <InternProfileDrawer 
      internId={internId} 
      isOpen={isOpen} 
      onClose={() => dispatch(closeProfile())} 
    />
  );
};