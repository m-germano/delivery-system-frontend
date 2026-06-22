const AUTH_STORAGE_KEY = 'delivery-auth-storage';

function getStoredToken() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

function getWebSocketBaseUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/$/, '');
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
  const url = new URL(apiBaseUrl);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${url.host}`;
}

export function connectOrderTrackingSocket(orderId, handlers = {}) {
  const token = getStoredToken();

  if (!token) {
    handlers.onError?.(new Error('Token não encontrado.'));
    return null;
  }

  const url = `${getWebSocketBaseUrl()}/ws/orders/${orderId}/tracking?token=${encodeURIComponent(token)}`;
  const socket = new WebSocket(url);

  socket.onopen = () => {
    handlers.onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      handlers.onMessage?.(payload);
    } catch {
      handlers.onError?.(new Error('Mensagem inválida recebida do WebSocket.'));
    }
  };

  socket.onerror = () => {
    handlers.onError?.(new Error('Erro na conexão de acompanhamento.'));
  };

  socket.onclose = () => {
    handlers.onClose?.();
  };

  return socket;
}
