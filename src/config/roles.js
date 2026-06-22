export const ROLE_IDS = Object.freeze({
  ADMIN: 1,
  COMPANY: 2,
  COURIER: 3,
  CUSTOMER: 4,
});

export const ROLE_LABELS = Object.freeze({
  ADMIN: 'Admin',
  COMPANY: 'Empresa',
  COURIER: 'Entregador',
  CUSTOMER: 'Cliente',
});

export const PUBLIC_REGISTER_ROLES = [
  { value: ROLE_IDS.COMPANY, key: 'COMPANY', label: 'Empresa' },
  { value: ROLE_IDS.COURIER, key: 'COURIER', label: 'Entregador' },
  { value: ROLE_IDS.CUSTOMER, key: 'CUSTOMER', label: 'Cliente' },
];

export function getRoleKey(user) {
  if (!user) return null;

  const rawRoleName = user.role_name ?? user.role?.name ?? user.role ?? user.profile;

  if (typeof rawRoleName === 'string') {
    const normalized = rawRoleName.trim().toUpperCase();
    if (ROLE_LABELS[normalized]) return normalized;
  }

  const roleId = Number(user.role_id ?? user.roleId ?? user.role?.id);

  return Object.entries(ROLE_IDS).find(([, value]) => value === roleId)?.[0] ?? null;
}

export function getRoleLabel(user) {
  const roleKey = getRoleKey(user);
  return roleKey ? ROLE_LABELS[roleKey] : 'Sem perfil';
}
