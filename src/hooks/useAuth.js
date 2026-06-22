import { useAuthStore } from '../stores/useAuthStore.js';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    token,
    status,
    error,
    login,
    register,
    logout,
    isAuthenticated: Boolean(token),
  };
}
