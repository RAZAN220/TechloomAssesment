import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route guard — redirects unauthenticated users to /login (preserving the
 * intended destination) and optionally enforces the admin role.
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return <LoadingSpinner full label="Checking your session…" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
