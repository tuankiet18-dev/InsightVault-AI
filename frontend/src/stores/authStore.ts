import { create } from 'zustand';
import { authApi } from '../api/authApi';
import { setToken, clearToken, getToken } from '../api/http';
import type { UserDto } from '../types/api';
import { toast } from 'sonner';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!getToken(),
  isLoading: true, // Initially true while we verify token

  loginWithGoogle: async (idToken: string) => {
    try {
      const response = await authApi.loginWithGoogle(idToken);
      setToken(response.accessToken);
      set({ user: response.user, isAuthenticated: true });
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Login failed. Please try again.');
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout API failed, continuing local cleanup', e);
    } finally {
      clearToken();
      set({ user: null, isAuthenticated: false });
      toast.info('You have been logged out.');
    }
  },

  fetchCurrentUser: async () => {
    if (!getToken()) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    
    try {
      const user = await authApi.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user', error);
      clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
