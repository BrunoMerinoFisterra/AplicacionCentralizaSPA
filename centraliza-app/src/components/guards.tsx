import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="login-wrap">
        <span className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="login-wrap">
        <span className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  // El backend re-valida el rol en cada endpoint; esto solo oculta la UI.
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
