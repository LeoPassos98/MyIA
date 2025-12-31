// frontend/src/features/settings/components/ApiKeysTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, Alert, CircularProgress } from '@mui/material';
import { SettingsSection } from './SettingsSection';

import { aiProvidersService } from '../../../services/aiProvidersService';
import { api } from '../../../services/api';
import { AIProvider } from '../../../types/ai';

export default function ApiKeysTab() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const providersList = await aiProvidersService.getAll();
        setProviders(providersList);

        const { data: savedKeys } = await api.get('/settings/credentials');
        setApiKeys(savedKeys || {});

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

  if (loading) return <Box sx={{ p: 3 }}><CircularProgress /></Box>;

  return (
    <SettingsSection 
      title="Chaves de API (Provedores)" 
      description="Gerencie suas conexões. Se deixar em branco, o sistema tentará usar chaves globais se disponíveis."
    >
      {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}
      
      <Grid container spacing={3}>
        {providers.map((provider) => (
          <Grid item xs={12} md={6} key={provider.id}>
            <TextField
              fullWidth
              type="password"
              label={`Chave da ${provider.name}`}
              placeholder={`Cole sua API Key da ${provider.name} aqui`}
              value={apiKeys[provider.slug] || ''}
              onChange={handleChange(provider.slug)}
              helperText={
                provider.slug === 'openai' ? 'Geralmente começa com sk-...' : 
                provider.slug === 'groq' ? 'Geralmente começa com gsk_...' : 
                `Chave para usar modelos como: ${provider.models.map(m => m.name).slice(0, 2).join(', ')}...`
              }
              InputProps={{
                startAdornment: provider.logoUrl ? (
                  <Box component="img" src={provider.logoUrl} sx={{ width: 24, height: 24, mr: 1, borderRadius: '50%' }} />
                ) : null
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        ))}
        
        {providers.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">Nenhum provedor de IA configurado no sistema.</Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={isSaving}
              sx={{ fontWeight: 'bold', px: 4 }}
            >
              {isSaving ? 'Salvando...' : 'Salvar Todas as Chaves'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </SettingsSection>
  );
}
