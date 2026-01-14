// frontend/src/features/settings/components/providers/AWSProviderPanel.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
import { 
  Box, TextField, Button, Alert, CircularProgress, 
  FormGroup, FormControlLabel, Checkbox, Typography, Divider,
  LinearProgress, Chip
} from '@mui/material';
import { CheckCircle, Error, Warning } from '@mui/icons-material';
import { userSettingsService } from '../../../../services/userSettingsService';
import { api } from '../../../../services/api';

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export default function AWSProviderPanel() {
  const [credentials, setCredentials] = useState({ accessKey: '', secretKey: '', region: 'us-east-1' });
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);

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
        setValidationStatus('valid');
      }

      setAvailableModels(modelsRes.data.models || []);
      setSelectedModels(settings.awsEnabledModels || []);
    } catch (error) {
      console.error('Erro ao carregar config AWS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidationStatus('validating');
    setMsg(null);
    setValidationResult(null);

    try {
      const response = await api.post('/providers/bedrock/validate', {
        accessKey: credentials.accessKey,
        secretKey: credentials.secretKey,
        region: credentials.region
      });

      if (response.data.status === 'valid') {
        setValidationStatus('valid');
        setValidationResult(response.data);
        setMsg({ 
          type: 'success', 
          text: `✅ ${response.data.message} (${response.data.latencyMs}ms)` 
        });
      } else {
        setValidationStatus('invalid');
        setValidationResult(response.data);
        setMsg({ 
          type: 'error', 
          text: `❌ ${response.data.error}` 
        });
      }
    } catch (error: any) {
      setValidationStatus('invalid');
      setMsg({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erro ao validar credenciais' 
      });
    }
  };

  const handleSave = async () => {
    if (validationStatus !== 'valid') {
      setMsg({ type: 'warning', text: 'Valide as credenciais antes de salvar' });
      return;
    }

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

  const canSelectModels = validationStatus === 'valid';

  return (
    <Box component="form" onSubmit={(e) => e.preventDefault()}>
      {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Credenciais AWS</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Access Key ID"
            placeholder="AKIAIOSFODNN7EXAMPLE"
            value={credentials.accessKey}
            onChange={(e) => {
              setCredentials(prev => ({ ...prev, accessKey: e.target.value }));
              setValidationStatus('idle');
            }}
            disabled={validationStatus === 'validating'}
          />
          <TextField
            fullWidth
            type="password"
            label="Secret Access Key"
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            value={credentials.secretKey}
            onChange={(e) => {
              setCredentials(prev => ({ ...prev, secretKey: e.target.value }));
              setValidationStatus('idle');
            }}
            disabled={validationStatus === 'validating'}
          />
          <TextField
            fullWidth
            label="Região"
            value={credentials.region}
            onChange={(e) => {
              setCredentials(prev => ({ ...prev, region: e.target.value }));
              setValidationStatus('idle');
            }}
            disabled={validationStatus === 'validating'}
            helperText="Ex: us-east-1, us-west-2"
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              variant="outlined"
              onClick={handleValidate}
              disabled={validationStatus === 'validating' || !credentials.accessKey || !credentials.secretKey}
            >
              {validationStatus === 'validating' ? 'Testando...' : 'Testar Conexão'}
            </Button>

            {validationStatus === 'valid' && (
              <Chip icon={<CheckCircle />} label="Válido" color="success" />
            )}
            {validationStatus === 'invalid' && (
              <Chip icon={<Error />} label="Inválido" color="error" />
            )}
          </Box>

          {validationStatus === 'validating' && <LinearProgress />}

          {validationResult?.suggestion && (
            <Alert severity="info" icon={<Warning />}>
              <strong>Sugestão:</strong> {validationResult.suggestion}
            </Alert>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 4, opacity: canSelectModels ? 1 : 0.5 }}>
        <Typography variant="h6" gutterBottom>Modelos Habilitados</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {canSelectModels 
            ? 'Selecione os modelos que deseja usar. Apenas os selecionados aparecerão no chat.'
            : '⚠️ Valide as credenciais primeiro para habilitar a seleção de modelos'
          }
        </Typography>

        <FormGroup>
          {availableModels.map((model) => (
            <FormControlLabel
              key={model.id}
              disabled={!canSelectModels}
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
        disabled={isSaving || validationStatus !== 'valid' || selectedModels.length === 0}
        sx={{ fontWeight: 'bold', px: 4 }}
      >
        {isSaving ? 'Salvando...' : 'Salvar Configuração AWS'}
      </Button>
    </Box>
  );
}
