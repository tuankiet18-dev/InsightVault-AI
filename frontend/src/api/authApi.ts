import { http } from './http';
import type { UserDto, AuthResponse } from '../types/api';

export const authApi = {
  loginWithGoogle: (idToken: string) => {
    return http.post<AuthResponse>('/auth/google', { idToken });
  },

  getCurrentUser: () => {
    return http.get<UserDto>('/auth/me');
  },

  logout: () => {
    return http.post<void>('/auth/logout');
  },
};
