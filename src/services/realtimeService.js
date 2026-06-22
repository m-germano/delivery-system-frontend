const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
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

function buildRealtimeUrl(path) {
  const normalizedBaseUrl = WS_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const token = getStoredToken();
  const separator = normalizedPath.includes('?') ? '&' : '?';

  return `${normalizedBaseUrl}${normalizedPath}${separator}token=${encodeURIComponent(token ?? '')}`;
}

export function connectRealtime(path, handlers = {}) {
  const token = getStoredToken();

  if (!token) {
    handlers.onError?.(new Error('Sessão não encontrada para conexão em tempo real.'));
    return null;
  }

  const socket = new WebSocket(buildRealtimeUrl(path));

  socket.addEventListener('open', (event) => {
    handlers.onOpen?.(event);
  });

  socket.addEventListener('message', (event) => {
    try {
      handlers.onMessage?.(JSON.parse(event.data));
    } catch {
      handlers.onMessage?.({ type: 'message.raw', data: event.data });
    }
  });

  socket.addEventListener('close', (event) => {
    handlers.onClose?.(event);
  });

  socket.addEventListener('error', (event) => {
    handlers.onError?.(event);
  });

  return socket;
}
