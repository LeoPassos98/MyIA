// frontend/src/features/login/hooks/useLogin.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export default function useLogin() {
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authLogin(email, password);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
