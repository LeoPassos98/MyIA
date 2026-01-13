// frontend/src/contexts/AuthContext.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, User } from '../services/authService';
import { api } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginSocial: (token: string, user: User) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 🔧 FIX: Flag para evitar múltiplas validações simultâneas
  const isValidatingRef = React.useRef(false);

  const logout = useCallback(() => {
    console.log('[AuthContext] Logout chamado. Limpando dados.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      // 🔧 FIX: Evita múltiplas validações simultâneas (React StrictMode)
      if (isValidatingRef.current) {
        console.log('[AuthContext] Validação já em andamento, ignorando...');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      if (token && token !== 'undefined' && token !== 'null') {
        console.log('[AuthContext] Token encontrado, validando...');
        isValidatingRef.current = true;
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/me');
          const userData = response.data?.user || response.data?.data?.user || response.data;

          if (userData && userData.id) {
             setUser(userData);
             setIsAuthenticated(true);
             console.log('[AuthContext] Usuário carregado:', userData.email);
          } else {
             throw new Error('Estrutura de usuário inválida');
          }
        } catch (error: any) {
          // 🔧 FIX: Não desloga se for rate limit (429)
          if (error.response?.status === 429) {
            console.warn('[AuthContext] Rate limit atingido, mantendo sessão...');
            // Assume que o token é válido se já estava no localStorage
            setIsAuthenticated(true);
          } else {
            console.error('[AuthContext] Token inválido ou expirado:', error);
            logout();
          }
        } finally {
          isValidatingRef.current = false;
        }
      } else {
        console.log('[AuthContext] Nenhum token encontrado no localStorage.');
      }
      setLoading(false);
    };
    loadUser();
  }, [logout]);

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] Tentando login...');
    const response = await api.post('/auth/login', { email, password });
    
    console.log('[AuthContext] Resposta bruta do login:', response);

    // 🛑 LÓGICA ROBUSTA DE EXTRAÇÃO (O Pulo do Gato)
    // Verifica diferentes níveis de profundidade para achar o token/user
    // 1. Tenta pegar direto (se interceptor retornou data)
    // 2. Tenta pegar dentro de .data (se interceptor retornou response axios)
    // 3. Tenta pegar dentro de .data.data (se for JSend puro sem tratamento)
    const payload = response.data?.token ? response.data : 
                    (response.data?.data?.token ? response.data.data : response);

    const { token, user: userData } = payload;

    if (!token || token === 'undefined') {
      console.error('[AuthContext] ❌ ERRO CRÍTICO: Token não encontrado na resposta!', payload);
      throw new Error('Falha ao obter token de acesso.');
    }

    console.log('[AuthContext] ✅ Token recebido. Salvando...');
    
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 🔧 FIX: Aguarda propagação do localStorage antes de atualizar estado
    await new Promise(resolve => setTimeout(resolve, 50));
    
    setUser(userData);
    setIsAuthenticated(true);
    console.log('[AuthContext] Estado após login:', { user: userData, isAuthenticated: true });
  };

  const register = async (email: string, password: string, name?: string) => {
    await authService.register({ email, password, name });
    await login(email, password);
  };

  const loginSocial = async (token: string, userData: User) => {
    if (!token) return;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 🔧 FIX: Aguarda propagação do localStorage
    await new Promise(resolve => setTimeout(resolve, 50));
    
    setUser(userData);
    setIsAuthenticated(true);
    console.log('[AuthContext] Estado após loginSocial:', { user: userData, isAuthenticated: true });
  };

  const setUserData = (userData: User) => setUser(userData);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        login,
        register,
        loginSocial,
        logout,
        setUser: setUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};