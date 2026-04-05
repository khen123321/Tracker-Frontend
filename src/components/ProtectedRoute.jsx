// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check if the token exists in localStorage
  const token = localStorage.getItem('cims_token');

  // If no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the child routes (the Dashboard)
  return <Outlet />;
};

export default ProtectedRoute;