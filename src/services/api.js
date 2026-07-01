import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export const AUTH_STORAGE_KEY = 'delivery-auth-storage';
export const AUTH_EXPIRED_EVENT = 'delivery:auth-expired';

let accessToken = null;

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function setApiAccessToken(token) {
  accessToken = token || null;
}

export function clearApiAccessToken() {
  accessToken = null;
}

export function clearAuthStorage() {
  accessToken = null;

  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignora ambientes sem localStorage.
  }
}

export function getStoredAuthState() {
  if (!canUseLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return getStoredAuthState()?.token ?? null;
}

export function getAccessToken() {
  return accessToken || getStoredToken();
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url ?? '';

    const isLoginRequest = requestUrl.includes('/auth/login');
    const isRegisterRequest = requestUrl.includes('/auth/register');

    if (status === 401 && !isLoginRequest && !isRegisterRequest) {
      clearAuthStorage();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error, fallback = 'Não foi possível concluir a operação.') {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg ?? item).join(' | ');
  }

  if (typeof detail === 'string') return detail;

  return error?.response?.data?.message ?? error?.message ?? fallback;
}
