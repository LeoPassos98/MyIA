import { api } from './api';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async register(data: RegisterData): Promise<{ userId: string }> {
    const response = await api.post('/auth/register', {
      email: data.email,
      password: data.password,
      name: data.name
    });
    return response.data;
  },

  login: async (data: LoginData) => {
    const payload = {
      email: data.email,
      password: data.password
    };
    
    const response = await api.post('/auth/login', payload);
    const { token, user } = response.data;
    
    // Salvar no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  },

  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<void> {
    const response = await api.post('/auth/change-password', {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    });
    return response.data;
  },
};