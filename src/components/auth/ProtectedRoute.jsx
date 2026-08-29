import React from 'react';
import { Navigate } from 'react-router-dom';
import RequireAuth from './RequireAuth';

// This component will check if user is authenticated
// If not, it will show the RequireAuth component
const ProtectedRoute = ({ children, isAuthenticated }) => {
    if (!isAuthenticated) {
        return <RequireAuth />;
    }

    return children;
};

export default ProtectedRoute;