// frontend/src/features/settings/components/providers/AWSProviderPanel.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  Box, TextField, Button, Alert, CircularProgress,
  FormGroup, FormControlLabel, Checkbox, Typography, Divider,
  LinearProgress, Chip, Tooltip, Select, MenuItem, ListSubheader
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Warning } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAWSConfig } from '../../hooks/useAWSConfig';

// Regiões AWS atualizadas conforme padrão Amazon
const REGION_GROUPS = [
  {
    label: 'Estados Unidos',
    regions: [
      { value: 'us-east-1', label: 'Norte da Virgínia (us-east-1)' },
      { value: 'us-east-2', label: 'Ohio (us-east-2)' },
      { value: 'us-west-1', label: 'Norte da Califórnia (us-west-1)' },
      { value: 'us-west-2', label: 'Oregon (us-west-2)' }
    ]
  },
  {
    label: 'Ásia-Pacífico',
    regions: [
      { value: 'ap-south-1', label: 'Mumbai (ap-south-1)' },
      { value: 'ap-northeast-3', label: 'Osaka (ap-northeast-3)' },
      { value: 'ap-northeast-2', label: 'Seul (ap-northeast-2)' },
      { value: 'ap-southeast-1', label: 'Cingapura (ap-southeast-1)' },
      { value: 'ap-southeast-2', label: 'Sydney (ap-southeast-2)' },
      { value: 'ap-northeast-1', label: 'Tóquio (ap-northeast-1)' }
    ]
  },
  {
    label: 'Canadá',
    regions: [
      { value: 'ca-central-1', label: 'Central (ca-central-1)' }
    ]
  },
  {
    label: 'Europa',
    regions: [
      { value: 'eu-central-1', label: 'Frankfurt (eu-central-1)' },
      { value: 'eu-west-1', label: 'Irlanda (eu-west-1)' },
      { value: 'eu-west-2', label: 'Londres (eu-west-2)' },
      { value: 'eu-west-3', label: 'Paris (eu-west-3)' },
      { value: 'eu-north-1', label: 'Estocolmo (eu-north-1)' }
    ]
  },
  {
    label: 'América do Sul',
    regions: [
      { value: 'sa-east-1', label: 'São Paulo (sa-east-1)' }
    ]
  }
];

export default function AWSProviderPanel() {
  const theme = useTheme();
  const {
    formState,
    isLoading,
    isSaving,
    error,
    success,
    validationStatus,
    validationResult,
    availableModels,
    selectedModels,
    handleFieldChange,
    handleValidate,
    handleSave,
    toggleModel,
  } = useAWSConfig();

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const canSelectModels = validationStatus === 'valid';

  return (
    <Box component="form" onSubmit={e => e.preventDefault()}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, color: theme.palette.error.main }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, color: theme.palette.primary.main }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Credenciais AWS</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Tooltip title="ID da sua Access Key AWS. Nunca compartilhe com terceiros." arrow>
            <TextField
              fullWidth
              label="Access Key ID"
              placeholder="Access Key ID - Ex: AKIAIOSFODNN7EXAMPLE (16 caracteres após AKIA)"
              value={formState.accessKey}
              onChange={e => handleFieldChange('accessKey', e.target.value.trim())}
              disabled={validationStatus === 'validating'}
              sx={{ mb: 1 }}
            />
          </Tooltip>
          <Tooltip title="Sua chave secreta AWS. Nunca será exibida após salvar." arrow>
            <TextField
              fullWidth
              type="password"
              label="Secret Access Key"
              placeholder={formState.secretKey ? '********' : 'Secret Access Key - Ex: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY (40 caracteres)'}
              value={formState.secretKey}
              onChange={e => handleFieldChange('secretKey', e.target.value.trim())}
              disabled={validationStatus === 'validating'}
              sx={{ mb: 1 }}
            />
          </Tooltip>
          <Tooltip title="Região AWS onde seus modelos estão disponíveis." arrow>
            <Select
              fullWidth
              value={formState.region}
              onChange={e => handleFieldChange('region', e.target.value.trim())}
              disabled={validationStatus === 'validating'}
              sx={{ mb: 1 }}
              displayEmpty
              renderValue={selected => {
                const found = REGION_GROUPS.flatMap(g => g.regions).find(r => r.value === selected);
                return found ? found.label : 'Selecione a região';
              }}
            >
              <MenuItem value="" disabled>Selecione a região</MenuItem>
              {REGION_GROUPS.map(group => [
                <ListSubheader key={group.label}>{group.label}</ListSubheader>,
                ...group.regions.map(region => (
                  <MenuItem key={region.value} value={region.value}>
                    {region.label}
                  </MenuItem>
                ))
              ])}
            </Select>
          </Tooltip>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Tooltip title="Testa as credenciais e salva se forem válidas." arrow>
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    await handleValidate();
                    if (validationStatus === 'valid') await handleSave();
                  }}
                  disabled={validationStatus === 'validating' || !formState.accessKey || !formState.secretKey}
                  sx={{ fontWeight: 'bold', px: 4, transition: 'all 0.2s' }}
                >
                  {validationStatus === 'validating' || isSaving ? 'Testando...' : 'Testar e Salvar'}
                </Button>
              </span>
            </Tooltip>
            {validationStatus === 'valid' && (
              <Chip icon={<CheckCircle />} label="Válido" color="success" />
            )}
            {validationStatus === 'invalid' && (
              <Chip icon={<ErrorIcon />} label="Inválido" color="error" />
            )}
          </Box>

          {validationStatus === 'validating' && <LinearProgress sx={{ mt: 1 }} />}

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
            <Tooltip
              key={model.id}
              title={
                <>
                  <div>Modelo: {model.name} ({model.apiModelId})</div>
                  <div>Custo: ${model.costPer1kInput}/1k in, ${model.costPer1kOutput}/1k out</div>
                </>
              }
              placement="right"
              arrow
            >
              <FormControlLabel
                disabled={!canSelectModels}
                control={
                  <Checkbox
                    checked={selectedModels.includes(model.apiModelId)}
                    onChange={() => toggleModel(model.apiModelId)}
                    tabIndex={0}
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
            </Tooltip>
          ))}
        </FormGroup>
      </Box>
    </Box>
  );
}
