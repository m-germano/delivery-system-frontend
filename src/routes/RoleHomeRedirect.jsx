import { Navigate } from 'react-router-dom';
import { getDefaultRouteForUser } from '../utils/authRedirect.js';
import { useAuthStore } from '../stores/useAuthStore.js';

export default function RoleHomeRedirect() {
  const user = useAuthStore((state) => state.user);
  const target = getDefaultRouteForUser(user);

  return <Navigate to={target} replace />;
}
