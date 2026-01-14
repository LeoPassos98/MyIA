// frontend/src/features/settings/components/providers/AWSProviderPanel.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, Alert, CircularProgress, 
  FormGroup, FormControlLabel, Checkbox, Typography, Divider 
} from '@mui/material';
import { userSettingsService } from '../../../../services/userSettingsService';
import { api } from '../../../../services/api';

export default function AWSProviderPanel() {
  const [credentials, setCredentials] = useState({ accessKey: '', secretKey: '', region: 'us-east-1' });
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadAWSConfig();
  }, []);

  const loadAWSConfig = async () => {
    try {
      const [settings, modelsRes] = await Promise.all([
        userSettingsService.getSettings(),
        api.get('/providers/bedrock/models')
      ]);

      if (settings.awsAccessKey) {
        setCredentials({
          accessKey: settings.awsAccessKey,
          secretKey: settings.awsSecretKey || '',
          region: settings.awsRegion || 'us-east-1'
        });
      }

      setAvailableModels(modelsRes.data.models || []);
      setSelectedModels(settings.awsEnabledModels || []);
    } catch (error) {
      console.error('Erro ao carregar config AWS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);

    try {
      await userSettingsService.updateSettings({
        awsAccessKey: credentials.accessKey,
        awsSecretKey: credentials.secretKey,
        awsRegion: credentials.region,
        awsEnabledModels: selectedModels
      });

      setMsg({ type: 'success', text: 'Configuração AWS salva com sucesso!' });
    } catch (error: any) {
      setMsg({ type: 'error', text: error.response?.data?.message || 'Erro ao salvar' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
    );
  };

  if (loading) return <Box sx={{ p: 3 }}><CircularProgress /></Box>;

  return (
    <Box>
      {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Credenciais AWS</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Access Key ID"
            placeholder="AKIAIOSFODNN7EXAMPLE"
            value={credentials.accessKey}
            onChange={(e) => setCredentials(prev => ({ ...prev, accessKey: e.target.value }))}
          />
          <TextField
            fullWidth
            type="password"
            label="Secret Access Key"
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            value={credentials.secretKey}
            onChange={(e) => setCredentials(prev => ({ ...prev, secretKey: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Região"
            value={credentials.region}
            onChange={(e) => setCredentials(prev => ({ ...prev, region: e.target.value }))}
            helperText="Ex: us-east-1, us-west-2"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Modelos Habilitados</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecione os modelos que deseja usar. Apenas os selecionados aparecerão no chat.
        </Typography>

        <FormGroup>
          {availableModels.map((model) => (
            <FormControlLabel
              key={model.id}
              control={
                <Checkbox 
                  checked={selectedModels.includes(model.apiModelId)}
                  onChange={() => toggleModel(model.apiModelId)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">{model.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {model.apiModelId} • ${model.costPer1kInput}/1k in • ${model.costPer1kOutput}/1k out
                  </Typography>
                </Box>
              }
            />
          ))}
        </FormGroup>
      </Box>

      <Button 
        variant="contained" 
        onClick={handleSave} 
        disabled={isSaving}
        sx={{ fontWeight: 'bold', px: 4 }}
      >
        {isSaving ? 'Salvando...' : 'Salvar Configuração AWS'}
      </Button>
    </Box>
  );
}
