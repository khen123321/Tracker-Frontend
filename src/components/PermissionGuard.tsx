import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store'; // Adjust path if needed

interface PermissionGuardProps {
    requiredPermission: string;
    children: React.ReactNode;
}

const PermissionGuard = ({ requiredPermission, children }: PermissionGuardProps) => {
    //  Get user and permissions directly from Redux
    const { user } = useSelector((state: RootState) => state.auth);

    // 1. If no user is found, block access
    if (!user) {
        return null; // Or <Navigate to="/login" replace />
    }

    // 2. Superadmins get a free pass to everything
    if (user.role?.toLowerCase() === 'superadmin') {
        return <>{children}</>;
    }

    // 3. Check if the user has the specific required permission
    const userPermissions = user.permissions || [];
    const hasPermission = userPermissions.includes(requiredPermission);

    if (!hasPermission) {
        // You can return null (blank) or redirect them somewhere else
        // return <Navigate to="/dashboard" replace />;
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <h2>You do not have permission to view this page.</h2>
            </div>
        );
    }

    // 4. Permission granted! Render the page.
    return <>{children}</>;
};

export default PermissionGuard;