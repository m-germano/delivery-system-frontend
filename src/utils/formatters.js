export function formatCurrency(value) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
}

export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DS';
}

/**
 * Formata distância em km de forma legível.
 * < 1km exibe em metros, senão exibe em km com 1 casa decimal (pt-BR).
 */
export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return 'Distância indisponível';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

/**
 * Formata data/hora no padrão pt-BR.
 * Aceita string ISO, timestamp ou Date.
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

