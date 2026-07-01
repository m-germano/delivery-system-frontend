import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingScreen from '../components/ui/LoadingScreen.jsx';
import { getRoleKey } from '../config/roles.js';
import { getDefaultRouteForUser } from '../utils/authRedirect.js';
import { useAuthStore } from '../stores/useAuthStore.js';

const SETUP_PATHS_BY_ROLE = Object.freeze({
  COMPANY: '/company/settings',
  CUSTOMER: '/customer/addresses',
});

const ALWAYS_ALLOWED_AUTH_PATHS = new Set(['/profile', '/unauthorized']);

export function AuthGuard() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
  const location = useLocation();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) return;
    if (user) return;
    if (status === 'loading') return;

    loadCurrentUser();
  }, [hasHydrated, loadCurrentUser, status, token, user]);

  if (!hasHydrated) {
    return <LoadingScreen message="Carregando sua sessão..." />;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user || status === 'loading') {
    return <LoadingScreen message="Validando sua sessão..." />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) return;
    if (user) return;
    if (status === 'loading') return;

    loadCurrentUser();
  }, [hasHydrated, loadCurrentUser, status, token, user]);

  if (!hasHydrated || (token && !user)) {
    return <LoadingScreen message="Carregando sua sessão..." />;
  }

  if (token && user) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  return children;
}

export function RoleGuard({ roles }) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const roleKey = getRoleKey(user);

  if (!roles.includes(roleKey)) {
    return <Navigate to="/unauthorized" replace state={{ attemptedPath: location.pathname }} />;
  }

  return <Outlet />;
}

export function OnboardingGuard() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const completionStatus = useAuthStore((state) => state.completionStatus);
  const completionChecked = useAuthStore((state) => state.completionChecked);
  const loadCompletionStatus = useAuthStore((state) => state.loadCompletionStatus);
  const roleKey = getRoleKey(user);

  useEffect(() => {
    if (!completionChecked) {
      loadCompletionStatus();
    }
  }, [completionChecked, loadCompletionStatus]);

  if (ALWAYS_ALLOWED_AUTH_PATHS.has(location.pathname)) {
    return <Outlet />;
  }

  if (!completionChecked) {
    return <LoadingScreen message="Verificando seu cadastro..." />;
  }

  if (!completionStatus) {
    return <Outlet />;
  }

  if (completionStatus.is_complete) {
    return <Outlet />;
  }

  const setupPath = completionStatus.next_path ?? SETUP_PATHS_BY_ROLE[roleKey];

  if (setupPath && location.pathname !== setupPath) {
    return <Navigate to={setupPath} replace state={{ onboardingMessage: completionStatus.message }} />;
  }

  return <Outlet />;
}
