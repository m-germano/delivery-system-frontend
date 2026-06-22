import { LogOut, PanelLeftClose, PanelLeftOpen, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../config/navigation.js';
import { getRoleKey, getRoleLabel } from '../../config/roles.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useUiStore } from '../../stores/useUiStore.js';
import { cn } from '../../utils/classNames.js';
import { getInitials } from '../../utils/formatters.js';
import Brand from './Brand.jsx';

function UserAvatar({ user, className = '' }) {
  const avatarUrl = user?.avatar_url ?? user?.avatarUrl ?? user?.image_url ?? user?.photo_url;

  if (avatarUrl) {
    return (
      <img
        className={cn('h-9 w-9 shrink-0 rounded-full object-cover', className)}
        src={avatarUrl}
        alt={user?.name ?? 'Usuário'}
      />
    );
  }

  return (
    <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-900 text-xs font-semibold text-white', className)}>
      {getInitials(user?.name)}
    </div>
  );
}

export default function Sidebar({ mobile = false }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);

  const roleKey = getRoleKey(user);
  const visibleItems = NAVIGATION_ITEMS.filter((item) => item.roles.includes(roleKey));
  const isCollapsed = !mobile && collapsed;

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [accountMenuOpen]);

  function handleProfileClick() {
    setAccountMenuOpen(false);
    if (mobile) closeMobileSidebar();
    navigate('/profile');
  }

  function handleLogout() {
    setAccountMenuOpen(false);
    logout();
    if (mobile) closeMobileSidebar();
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-ink-200/70 bg-white px-3 py-4 transition-all duration-200',
        isCollapsed ? 'w-[76px]' : 'w-64',
        mobile && 'w-full max-w-full',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <Brand collapsed={isCollapsed} />

        {mobile ? (
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            onClick={closeMobileSidebar}
            aria-label="Fechar menu"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <button
            type="button"
            className="hidden shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 lg:block"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>

      <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto" aria-label="Navegação principal">
        {visibleItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={mobile ? closeMobileSidebar : undefined}
              className={({ isActive }) =>
                cn('app-sidebar-link', isActive && 'app-sidebar-link-active', isCollapsed && 'justify-center px-0')
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      <div ref={menuRef} className="relative mt-4 border-t border-ink-100 pt-3">
        {accountMenuOpen ? (
          <div
            className={cn(
              'z-50 overflow-hidden rounded-xl border border-ink-200/70 bg-white py-1 shadow-lg shadow-ink-900/5',
              isCollapsed ? 'fixed bottom-6 left-[86px] w-56' : 'absolute bottom-full left-0 right-0 mb-2',
              mobile && 'absolute bottom-full left-0 right-0 mb-2',
            )}
            role="menu"
          >
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-ink-700 transition hover:bg-ink-50"
              onClick={handleProfileClick}
              role="menuitem"
            >
              <UserRound className="h-4 w-4 text-ink-400" />
              Informações da conta
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={handleLogout}
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className={cn('flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-ink-100', isCollapsed && 'justify-center')}
          onClick={() => setAccountMenuOpen((current) => !current)}
          aria-expanded={accountMenuOpen}
          aria-haspopup="menu"
          title={isCollapsed ? 'Conta' : undefined}
        >
          <UserAvatar user={user} />
          {!isCollapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{user?.name ?? 'Usuário'}</p>
              <p className="truncate text-xs text-ink-500">{getRoleLabel(user)}</p>
            </div>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
