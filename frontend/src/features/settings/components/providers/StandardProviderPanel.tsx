// frontend/src/features/settings/components/providers/StandardProviderPanel.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, TextField, Button, Grid, Alert, CircularProgress } from '@mui/material';
import { useApiKeysTab } from '../../hooks/useApiKeysTab';

export default function StandardProviderPanel() {
  const {
    providers,
    apiKeys,
    loading,
    isSaving,
    msg,
    handleChange,
    handleSave,
  } = useApiKeysTab();

  if (loading) return <Box sx={{ p: 3 }}><CircularProgress /></Box>;

  const standardProviders = providers.filter(p => !['bedrock', 'azure'].includes(p.slug));

  return (
    <Box>
      {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}
      
      <Grid container spacing={3}>
        {standardProviders.map((provider) => (
          <Grid item xs={12} md={6} key={provider.id}>
            <TextField
              fullWidth
              type="password"
              label={`${provider.name} API Key`}
              placeholder={`Cole sua chave aqui`}
              value={apiKeys[provider.slug] || ''}
              onChange={handleChange(provider.slug)}
              helperText={
                provider.slug === 'openai' ? 'Começa com sk-...' : 
                provider.slug === 'groq' ? 'Começa com gsk_...' : 
                `Modelos: ${provider.models.map(m => m.name).slice(0, 2).join(', ')}`
              }
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        ))}

        <Grid item xs={12}>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={isSaving}
            sx={{ fontWeight: 'bold', px: 4 }}
          >
            {isSaving ? 'Salvando...' : 'Salvar Chaves'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
