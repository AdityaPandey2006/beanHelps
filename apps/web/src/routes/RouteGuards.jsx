import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  getNextRoute,
  hasBeanerOnboarding,
  isTherapistTerminalOrComplete,
} from "../utils/routes.js";
import LoadingScreen from "../components/LoadingScreen.jsx";

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={getNextRoute(user)} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={getNextRoute(user)} replace />;

  return <Outlet />;
}

export function BeanerOnboardingGuard() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "beaner") return <Navigate to={getNextRoute(user)} replace />;
  if (hasBeanerOnboarding(user)) return <Navigate to="/home" replace />;

  return <Outlet />;
}

export function TherapistOnboardingGuard() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "beanpist") {
    return <Navigate to={getNextRoute(user)} replace />;
  }
  if (isTherapistTerminalOrComplete(user)) {
    return <Navigate to="/therapist/home" replace />;
  }

  return <Outlet />;
}
