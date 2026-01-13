// frontend/src/features/settings/components/useApiKeysTab.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
import { aiProvidersService } from '../../../services/aiProvidersService';
import { api } from '../../../services/api';
import { AIProvider } from '../../../types/ai';

type Msg = { type: 'success' | 'error', text: string } | null;

export function useApiKeysTab() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const providersList = await aiProvidersService.getAll();
        setProviders(providersList);

        const response = await api.get('/settings/credentials');
        // Interceptor desembrulha JSend: response.data.credentials
        setApiKeys(response.data.credentials || {});
      } catch (error) {
        console.error(error);
        setMsg({ type: 'error', text: 'Erro ao carregar configurações.' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (slug: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys(prev => ({ ...prev, [slug]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.post('/settings/credentials', apiKeys);
      setMsg({ type: 'success', text: 'Chaves atualizadas com sucesso!' });
    } catch (error) {
      setMsg({ type: 'error', text: 'Erro ao salvar chaves.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return {
    providers,
    apiKeys,
    loading,
    isSaving,
    msg,
    handleChange,
    handleSave,
  };
}
