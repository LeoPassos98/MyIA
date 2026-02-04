// frontend-admin/src/hooks/useLogin.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Custom Hook para lógica de login
 * Padrão: STANDARDS.md Seção 3.0 - Separação View/Logic
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { logger } from '../utils/logger';

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    setLoading(true);

    logger.info('Login attempt started', { 
      component: 'useLogin',
      action: 'handleLogin'
    });

    try {
      logger.debug('Sending login request', { 
        component: 'useLogin',
        action: 'apiCall'
      });

      const response = await fetch(`${API_CONFIG.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      logger.info('Login response received', { 
        component: 'useLogin',
        status: response.status
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciais inválidas');
      }

      const result = await response.json();
      
      const token = result.data?.token || result.token;
      const user = result.data?.user || result.user;
      
      if (!token) {
        throw new Error('Token não recebido do servidor');
      }
      
      logger.info('Login successful', { 
        component: 'useLogin',
        hasToken: !!token,
        hasUser: !!user
      });
      
      localStorage.setItem('auth_token', token);
      logger.info('Token stored', { 
        component: 'useLogin',
        action: 'storeToken'
      });
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        logger.info('User data stored', { 
          component: 'useLogin',
          userId: user.id
        });
      }
      
      logger.info('Redirecting to dashboard', { 
        component: 'useLogin',
        action: 'redirect'
      });
      
      navigate('/');
    } catch (err) {
      logger.error('Login failed', { 
        component: 'useLogin',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
      logger.debug('Login attempt finished', { component: 'useLogin' });
    }
  };

  return { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    error, 
    loading, 
    handleLogin 
  };
}
