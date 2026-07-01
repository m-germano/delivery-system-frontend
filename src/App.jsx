import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes/AppRoutes.jsx';
import { useAuthStore } from './stores/useAuthStore.js';

function AuthSessionBootstrapper() {
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

  return null;
}

export default function App() {
  return (
    <>
      <AuthSessionBootstrapper />
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} closeOnClick pauseOnHover theme="colored" />
    </>
  );
}
