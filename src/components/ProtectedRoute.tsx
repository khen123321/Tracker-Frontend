import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store'; // Adjust path if necessary

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  // ✨ THE FIX: Pull authentication state directly from Redux!
  const { token, user } = useSelector((state: RootState) => state.auth);

  // 1. If no token or no user data, redirect to login page
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Role-Based Access Check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role ?? '')) {
      
      // If an intern tries to access HR, bounce to intern dashboard
      if (user.role && user.role.startsWith('intern')) {
        return <Navigate to="/intern-dashboard" replace />;
      }

      // If HR tries to access superadmin, bounce to normal HR dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. If everything checks out, render the page!
  return <Outlet />;
};

export default ProtectedRoute;