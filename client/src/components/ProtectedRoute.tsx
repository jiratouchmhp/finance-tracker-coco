import { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui/Spinner';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" replace />;

  return children;
}
