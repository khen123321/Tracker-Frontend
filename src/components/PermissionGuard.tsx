import React from 'react';
import { Navigate } from 'react-router-dom';

interface PermissionGuardProps {
  requiredPermission: string;
  children: React.ReactNode;
}

export default function PermissionGuard({ requiredPermission, children }: PermissionGuardProps) {
    // 1. Grab the user data from local storage
    const user: { role?: string; permissions?: string[] } = JSON.parse(localStorage.getItem('user') ?? 'null') || {};
    
    // 2. Extract their specific permissions array (default to empty if none exist)
    const permissions: string[] = user.permissions || [];
    
    // 3. Check if they are the ultimate boss
    const isSuperAdmin: boolean = user.role?.toLowerCase() === 'superadmin';

    // 4. THE GATEKEEPER LOGIC
    // If they are the Super Admin, let them pass automatically.
    // Otherwise, check if their specific permissions array includes the required string.
    if (isSuperAdmin || permissions.includes(requiredPermission)) {
        return children;
    }

    // 5. BOUNCED
    // If they are just normal HR/Intern and don't have the checkbox for this page,
    // silently redirect them back to the main HR dashboard.
    return <Navigate to="/dashboard" replace />;
}