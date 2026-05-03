// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  // 1. Check if the token exists in localStorage
  const token = localStorage.getItem('cims_token');
  const userStr = localStorage.getItem('user');

  // 2. If no token or no user data, redirect to login page
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // Parse the user object safely
  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (error) {
    console.error("Failed to parse user data", error);
    // If user data is corrupted, force them to log in again
    localStorage.removeItem('cims_token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // 3. Role-Based Access Check
  // If this route specifically requests certain roles, check if the user is allowed
  if (allowedRoles && allowedRoles.length > 0) {
    
    if (!allowedRoles.includes(user.role)) {
      // Security block: User does NOT have the required role.
      
      // If an intern tries to hack their way into an HR page, bounce them to the intern dashboard
      if (user.role && user.role.startsWith('intern')) {
        return <Navigate to="/intern-dashboard" replace />;
      }
      
      // If HR tries to access a Superadmin page, bounce them to the normal HR dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 4. If token exists and roles match, render the child routes!
  return <Outlet />;
};

export default ProtectedRoute;