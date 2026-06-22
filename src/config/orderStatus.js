/**
 * Mapa central de status de pedido.
 * Usado por Badge (via variant) e por qualquer tela que precise exibir o status
 * de forma legível, evitando strings de enum cru ("EM_PREPARO") na interface.
 */
export const ORDER_STATUS = {
  ABERTO: { label: 'Aberto', variant: 'warning' },
  ACEITO: { label: 'Aceito', variant: 'info' },
  EM_PREPARO: { label: 'Em preparo', variant: 'info' },
  AGUARDANDO_ENTREGADOR: { label: 'Aguardando entregador', variant: 'warning' },
  EM_ENTREGA: { label: 'Em entrega', variant: 'info' },
  ENTREGUE: { label: 'Entregue', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'danger' },
  RECUSADO: { label: 'Recusado', variant: 'danger' },
};

export function getOrderStatusLabel(status) {
  return ORDER_STATUS[status]?.label ?? status ?? '—';
}

export function getOrderStatusVariant(status) {
  return ORDER_STATUS[status]?.variant ?? 'neutral';
}

const DELIVERY_STATUS = {
  PENDENTE: 'Pendente',
  ACEITA: 'Aceita',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function getDeliveryStatusLabel(status) {
  return DELIVERY_STATUS[status] ?? status ?? '—';
}
