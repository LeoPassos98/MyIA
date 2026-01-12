import { api } from './api';

// 1. Interfaces alinhadas ao JSend
interface JSendResponse<T> {
  status: 'success' | 'fail' | 'error';
  data: T;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  // Adicionado para suportar o que o Google/Github trarão
  avatarUrl?: string; 
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  // O Backend agora retorna { status: 'success', data: { user: { id: ... } } }
  async register(data: any): Promise<User> {
    const response = await api.post<JSendResponse<{ user: User }>>('/auth/register', data);
    return response.data.data.user;
  },

  async login(data: any): Promise<LoginResponse> {
    const response = await api.post<JSendResponse<LoginResponse>>('/auth/login', data);
    
    // Pegamos os dados de dentro do envelope 'data' do JSend
    const { token, user } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  },

  async getMe(): Promise<User> {
    const response = await api.get<JSendResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }
};