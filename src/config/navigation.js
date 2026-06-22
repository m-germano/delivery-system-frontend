import {
  BadgeCheck,
  Bike,
  Building2,
  ClipboardList,
  Home,
  LayoutDashboard,
  MapPin,
  ShoppingBag,
  Store,
  UserCog,
  Users,
  Utensils,
} from 'lucide-react';

export const DEFAULT_ROUTE_BY_ROLE = Object.freeze({
  ADMIN: '/admin/overview',
  COMPANY: '/company/overview',
  COURIER: '/courier/availability',
  CUSTOMER: '/customer/explore',
});

export const NAVIGATION_ITEMS = [
  {
    label: 'Visão geral',
    path: '/admin/overview',
    icon: Home,
    roles: ['ADMIN'],
  },
  {
    label: 'Usuários',
    path: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Empresas',
    path: '/admin/companies',
    icon: Building2,
    roles: ['ADMIN'],
  },
  {
    label: 'Pedidos do sistema',
    path: '/admin/orders',
    icon: ClipboardList,
    roles: ['ADMIN'],
  },
  {
    label: 'Dashboard',
    path: '/company/overview',
    icon: LayoutDashboard,
    roles: ['COMPANY'],
  },
  {
    label: 'Minha empresa',
    path: '/company/settings',
    icon: Store,
    roles: ['COMPANY'],
  },
  {
    label: 'Produtos',
    path: '/company/products',
    icon: Utensils,
    roles: ['COMPANY'],
  },
  {
    label: 'Pedidos recebidos',
    path: '/company/orders',
    icon: ClipboardList,
    roles: ['COMPANY'],
  },
  {
    label: 'Explorar',
    path: '/customer/explore',
    icon: ShoppingBag,
    roles: ['CUSTOMER'],
  },
  {
    label: 'Meus pedidos',
    path: '/customer/orders',
    icon: ClipboardList,
    roles: ['CUSTOMER'],
  },
  {
    label: 'Endereços',
    path: '/customer/addresses',
    icon: MapPin,
    roles: ['CUSTOMER'],
  },
  {
    label: 'Disponibilidade',
    path: '/courier/availability',
    icon: BadgeCheck,
    roles: ['COURIER'],
  },
  {
    label: 'Entregas disponíveis',
    path: '/courier/available-deliveries',
    icon: Bike,
    roles: ['COURIER'],
  },
  {
    label: 'Minhas entregas',
    path: '/courier/my-deliveries',
    icon: ClipboardList,
    roles: ['COURIER'],
  },
];

export const PAGE_TITLES = Object.freeze({
  '/profile': 'Informações da conta',
  '/unauthorized': 'Acesso negado',
});

export function getNavigationTitle(pathname) {
  const directTitle = NAVIGATION_ITEMS.find((item) => item.path === pathname)?.label ?? PAGE_TITLES[pathname];

  if (directTitle) return directTitle;
  if (/^\/customer\/orders\/[^/]+\/tracking$/.test(pathname)) return 'Acompanhar entrega';
  if (/^\/customer\/explore\/[^/]+$/.test(pathname)) return 'Restaurante';

  return 'DishDash';
}
