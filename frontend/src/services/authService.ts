// frontend/src/services/authService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { api } from './api';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

// 1. Defina exatamente o que o seu Backend retorna no Login
export interface LoginResponse {
  status: 'success' | 'error';
  data: {
    token: string;
    user: User;
  };
}

export const authService = {
  async login(data: any): Promise<LoginResponse> {
    console.log('[authService] Enviando login:', data);
    const response = await api.post<LoginResponse>('/auth/login', data);
    console.log('[authService] Resposta do backend (login):', response.data);
    return response.data; // Sempre JSend: { status, data: { token, user } }
  },

  async register(data: any): Promise<User> {
    console.log('[authService] Enviando registro:', data);
    const response = await api.post<{ user: User }>('/auth/register', data);
    console.log('[authService] Resposta do backend (register):', response.data);
    return response.data.user; // Interceptor desembrulha JSend
  },

  async changePassword(data: any): Promise<void> {
    await api.post('/auth/change-password', data);
  },

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};