import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getNavigationTitle } from '../../config/navigation.js';
import { getRoleLabel } from '../../config/roles.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useUiStore } from '../../stores/useUiStore.js';

export default function Header() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const openMobileSidebar = useUiStore((state) => state.openMobileSidebar);

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200/70 bg-white/80 px-4 py-3.5 backdrop-blur-sm lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 lg:hidden"
          onClick={openMobileSidebar}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-400">{getRoleLabel(user)}</p>
          <h1 className="truncate text-lg font-semibold text-ink-900 md:text-xl">
            {getNavigationTitle(location.pathname)}
          </h1>
        </div>
      </div>
    </header>
  );
}
