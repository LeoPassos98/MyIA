// frontend/src/features/register/hooks/useRegister.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export default function useRegister() {
  const { register: authRegister } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authRegister(name, email, password);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}
