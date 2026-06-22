import { Outlet } from 'react-router-dom';
import { useUiStore } from '../../stores/useUiStore.js';
import { cn } from '../../utils/classNames.js';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

export default function DashboardLayout() {
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar />
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/45"
            onClick={closeMobileSidebar}
            aria-label="Fechar menu"
          />
          <div className="relative h-full w-72 max-w-[86vw] bg-white shadow-xl shadow-ink-900/15">
            <Sidebar mobile />
          </div>
        </div>
      ) : null}

      <div className={cn('min-h-dvh transition-all duration-200', sidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <Header />
        <main className="px-4 py-5 sm:px-5 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
