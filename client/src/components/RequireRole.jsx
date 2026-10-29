import { Navigate, useLocation } from 'react-router';
import { homePathFor, useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from './States.jsx';

/**
 * Route guard. This is UX only: the API enforces the same rules on every request.
 */
export function RequireRole({ role, children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== role) return <Navigate to={homePathFor(user.role)} replace />;
  return children;
}
