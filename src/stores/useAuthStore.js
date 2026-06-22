import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getRoleKey } from '../config/roles.js';
import {
  AUTH_EXPIRED_EVENT,
  clearAuthStorage,
  getApiErrorMessage,
  setApiAccessToken,
} from '../services/api.js';
import { authService } from '../services/authService.js';

const initialState = {
  user: null,
  token: null,
  completionStatus: null,
  completionChecked: false,
  status: 'unauthenticated',
  error: null,
  hasHydrated: false,
};

function extractToken(loginResponse) {
  return loginResponse?.access_token ?? loginResponse?.token ?? loginResponse?.accessToken ?? null;
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      get roleKey() {
        return getRoleKey(get().user);
      },

      isAuthenticated: () => Boolean(get().token),

      hasAnyRole: (roles = []) => {
        const roleKey = getRoleKey(get().user);
        return roles.length === 0 || roles.includes(roleKey);
      },

      finishHydration: (error = null) => {
        if (error) {
          clearAuthStorage();
          set({ ...initialState, hasHydrated: true });
          return;
        }

        const token = get().token;

        if (token) {
          setApiAccessToken(token);
          set({
            hasHydrated: true,
            status: get().user ? 'authenticated' : 'idle',
            error: null,
            completionChecked: false,
            completionStatus: null,
          });
          return;
        }

        setApiAccessToken(null);
        set({
          ...initialState,
          hasHydrated: true,
        });
      },

      login: async ({ email, password }) => {
        clearAuthStorage();
        set({
          user: null,
          token: null,
          completionStatus: null,
          completionChecked: false,
          status: 'loading',
          error: null,
          hasHydrated: true,
        });

        try {
          const loginResponse = await authService.login({ email, password });
          const token = extractToken(loginResponse);

          if (!token) {
            throw new Error('A API não retornou um token de acesso.');
          }

          setApiAccessToken(token);

          let user = loginResponse?.user ?? null;

          set({
            token,
            user,
            completionStatus: null,
            completionChecked: false,
            status: 'authenticated',
            error: null,
            hasHydrated: true,
          });

          if (!user) {
            user = await get().loadCurrentUser();
          }

          return user;
        } catch (error) {
          const message = getApiErrorMessage(error, 'E-mail ou senha inválidos.');

          clearAuthStorage();
          set({
            ...initialState,
            hasHydrated: true,
            status: 'unauthenticated',
            error: message,
          });

          throw new Error(message);
        }
      },

      register: async (payload) => {
        set({ status: 'loading', error: null });

        try {
          const user = await authService.register(payload);
          set({ status: 'unauthenticated', error: null });
          return user;
        } catch (error) {
          const message = getApiErrorMessage(error, 'Não foi possível criar a conta.');
          set({ status: 'unauthenticated', error: message });
          throw new Error(message);
        }
      },

      loadCurrentUser: async () => {
        const token = get().token;

        if (!token) {
          setApiAccessToken(null);
          set({
            user: null,
            completionStatus: null,
            completionChecked: false,
            status: 'unauthenticated',
            error: null,
            hasHydrated: true,
          });
          return null;
        }

        setApiAccessToken(token);
        set({ status: 'loading', error: null });

        try {
          const user = await authService.me();

          set({
            user,
            status: 'authenticated',
            error: null,
            hasHydrated: true,
          });

          return user;
        } catch (error) {
          const message = getApiErrorMessage(error, 'Sessão expirada. Faça login novamente.');

          clearAuthStorage();
          set({
            ...initialState,
            hasHydrated: true,
            status: 'unauthenticated',
            error: message,
          });

          return null;
        }
      },

      loadCompletionStatus: async () => {
        const token = get().token;

        if (!token) {
          set({
            completionStatus: null,
            completionChecked: true,
          });
          return null;
        }

        setApiAccessToken(token);

        try {
          const completionStatus = await authService.completionStatus();

          set({
            completionStatus,
            completionChecked: true,
            error: null,
          });

          return completionStatus;
        } catch {
          set({
            completionStatus: null,
            completionChecked: true,
            error: null,
          });

          return null;
        }
      },

      resetCompletionStatus: () => {
        set({
          completionStatus: null,
          completionChecked: false,
        });
      },

      logout: () => {
        clearAuthStorage();
        set({
          ...initialState,
          hasHydrated: true,
          status: 'unauthenticated',
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'delivery-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state, error) => {
        state?.finishHydration?.(error);
      },
    },
  ),
);

if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    const state = useAuthStore.getState();

    if (!state.hasHydrated) {
      state.finishHydration();
    }
  }, 0);

  window.addEventListener(AUTH_EXPIRED_EVENT, () => {
    useAuthStore.getState().logout();
  });
}