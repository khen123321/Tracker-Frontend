import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PermissionGuard({ requiredPermission, children }) {
    // 1. Grab the user data from local storage
    const user = JSON.parse(localStorage.getItem('user')) || {};
    
    // 2. Extract their specific permissions array (default to empty if none exist)
    const permissions = user.permissions || [];
    
    // 3. Check if they are the ultimate boss
    const isSuperAdmin = user.role?.toLowerCase() === 'superadmin';

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