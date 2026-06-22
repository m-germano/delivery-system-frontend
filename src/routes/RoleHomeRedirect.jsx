import { Navigate } from 'react-router-dom';
import { DEFAULT_ROUTE_BY_ROLE } from '../config/navigation.js';
import { getRoleKey } from '../config/roles.js';
import { useAuthStore } from '../stores/useAuthStore.js';

export default function RoleHomeRedirect() {
  const user = useAuthStore((state) => state.user);
  const roleKey = getRoleKey(user);
  const target = DEFAULT_ROUTE_BY_ROLE[roleKey] ?? '/dashboard';

  return <Navigate to={target} replace />;
}
