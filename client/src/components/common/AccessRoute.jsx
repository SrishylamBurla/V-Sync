import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { canAccessModule } from "../../config/access";

export default function AccessRoute({ module }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!canAccessModule(module, user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
