import { DEFAULT_ROUTE_BY_ROLE, NAVIGATION_ITEMS } from '../config/navigation.js';
import { getRoleKey } from '../config/roles.js';

const AUTH_PUBLIC_PATHS = new Set(['/login', '/register']);
const AUTH_NEUTRAL_PATHS = new Set(['/', '/home', '/dashboard', '/unauthorized']);
const SHARED_AUTHENTICATED_PATHS = new Set(['/profile']);

const EXTRA_ROUTE_RULES = [
  { roles: ['CUSTOMER'], pattern: /^\/customer\/explore\/[^/]+$/ },
  { roles: ['CUSTOMER'], pattern: /^\/customer\/orders\/[^/]+\/tracking$/ },
  { roles: ['CUSTOMER'], pattern: /^\/checkout\/pix\/[^/]+$/ },
];

function normalizePath(path) {
  if (!path || typeof path !== 'string') return null;

  try {
    if (/^https?:\/\//i.test(path)) {
      const parsed = new URL(path);
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return null;
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function getDefaultRouteForUser(user) {
  const roleKey = getRoleKey(user);
  return DEFAULT_ROUTE_BY_ROLE[roleKey] ?? '/dashboard';
}

export function canRoleAccessPath(roleKey, path) {
  const normalizedPath = normalizePath(path);

  if (!roleKey || !normalizedPath) return false;
  if (SHARED_AUTHENTICATED_PATHS.has(normalizedPath)) return true;

  const directItem = NAVIGATION_ITEMS.find((item) => item.path === normalizedPath);
  if (directItem) return directItem.roles.includes(roleKey);

  return EXTRA_ROUTE_RULES.some((rule) => rule.roles.includes(roleKey) && rule.pattern.test(normalizedPath));
}

export function resolvePostLoginRedirect(user, fromPath) {
  const defaultRoute = getDefaultRouteForUser(user);
  const roleKey = getRoleKey(user);
  const normalizedPath = normalizePath(fromPath);

  if (!normalizedPath) return defaultRoute;
  if (AUTH_PUBLIC_PATHS.has(normalizedPath)) return defaultRoute;
  if (AUTH_NEUTRAL_PATHS.has(normalizedPath)) return defaultRoute;

  return canRoleAccessPath(roleKey, normalizedPath) ? normalizedPath : defaultRoute;
}
