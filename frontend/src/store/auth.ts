import { create } from 'zustand';
import { AuthState } from '../types';

interface AuthStore extends AuthState {
  login: (token: string, tenantId: string, user: AuthState['user']) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setTenantId: (tenantId: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token'),
  tenantId: localStorage.getItem('tenantId'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  isLoading: false,
  error: null,

  login: (token, tenantId, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('tenantId', tenantId);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, tenantId, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('user');
    set({ token: null, tenantId: null, user: null });
  },

  setError: (error) => set({ error }),
  setTenantId: (tenantId) => {
    localStorage.setItem('tenantId', tenantId);
    set({ tenantId });
  },
}));
