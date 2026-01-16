// frontend/src/features/settings/components/providers/AWSProviderPanel.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useMemo, memo } from 'react';
import {
  Box, TextField, Button, Alert, CircularProgress,
  FormGroup, FormControlLabel, Checkbox, Typography, Divider,
  LinearProgress, Chip, Tooltip, Select, MenuItem, ListSubheader,
  Accordion, AccordionSummary, AccordionDetails, InputAdornment
} from '@mui/material';
import {
  CheckCircle, Error as ErrorIcon, Warning,
  ExpandMore, Search
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAWSConfig } from '../../hooks/useAWSConfig';
import { EnrichedAWSModel } from '../../../../types/ai';

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

// Componente memoizado para item de modelo individual
const ModelCheckboxItem = memo(({
  model,
  isSelected,
  onToggle,
  disabled
}: {
  model: EnrichedAWSModel; // Tipagem correta
  isSelected: boolean;
  onToggle: (id: string) => void;
  disabled: boolean;
}) => {
  const hasDbInfo = model.isInDatabase !== false;
  const hasCostInfo = model.costPer1kInput > 0 || model.costPer1kOutput > 0;
  
  return (
    <Tooltip
      title={
        <Box>
          <div><strong>Modelo:</strong> {model.name}</div>
          <div><strong>ID:</strong> {model.apiModelId}</div>
          {model.providerName && <div><strong>Provedor:</strong> {model.providerName}</div>}
          {hasCostInfo && (
            <div><strong>Custo:</strong> ${model.costPer1kInput}/1k in, ${model.costPer1kOutput}/1k out</div>
          )}
          {model.contextWindow > 0 && (
            <div><strong>Context Window:</strong> {model.contextWindow.toLocaleString()} tokens</div>
          )}
          {model.responseStreamingSupported && (
            <div><strong>Streaming:</strong> Suportado</div>
          )}
          {!hasDbInfo && (
            <div style={{ marginTop: '8px', color: '#ffa726' }}>
              ⚠️ Modelo não cadastrado no banco (sem informações de custo)
            </div>
          )}
        </Box>
      }
      placement="top"
      arrow
      PopperProps={{
        modifiers: [
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
            },
          },
        ],
      }}
    >
      <FormControlLabel
        disabled={disabled}
        control={
          <Checkbox
            checked={isSelected}
            onChange={() => onToggle(model.apiModelId)}
            tabIndex={0}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{model.name}</Typography>
                {!hasDbInfo && (
                  <Chip
                    label="Novo"
                    size="small"
                    color="warning"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                {model.apiModelId}
              </Typography>
              {hasCostInfo && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  ${model.costPer1kInput}/1k in • ${model.costPer1kOutput}/1k out
                </Typography>
              )}
            </Box>
          </Box>
        }
      />
    </Tooltip>
  );
});

ModelCheckboxItem.displayName = 'ModelCheckboxItem';

export default function AWSProviderPanel() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Agrupar modelos por provedor e filtrar por busca
  const groupedModels = useMemo(() => {
    const filtered = availableModels.filter(model => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        model.name.toLowerCase().includes(search) ||
        model.apiModelId.toLowerCase().includes(search) ||
        (model.providerName && model.providerName.toLowerCase().includes(search))
      );
    });

    const groups: Record<string, typeof availableModels> = {};
    filtered.forEach(model => {
      const provider = model.providerName || 'Outros';
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [availableModels, searchTerm]);

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
              inputProps={{
                autoComplete: 'username'
              }}
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
              inputProps={{
                autoComplete: 'current-password'
              }}
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
        <Typography variant="h6" gutterBottom>Habilitar Modelos</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {canSelectModels
            ? 'Selecione os modelos que deseja usar. Apenas os selecionados aparecerão no chat.'
            : '⚠️ Valide as credenciais primeiro para habilitar a seleção de modelos'
          }
        </Typography>
        
        {availableModels.length === 0 && canSelectModels && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Nenhum modelo disponível encontrado. Verifique suas permissões AWS.
          </Alert>
        )}

        {availableModels.length > 0 && (
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                label={`${availableModels.length} modelos disponíveis`}
                color="primary"
                size="small"
              />
              <Chip
                label={`${selectedModels.length} selecionados`}
                color="success"
                size="small"
              />
              <Chip
                label={`${groupedModels.length} provedores`}
                color="info"
                size="small"
              />
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder="Buscar modelos por nome, ID ou provedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!canSelectModels}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            {groupedModels.length === 0 && searchTerm && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Nenhum modelo encontrado para "{searchTerm}"
              </Alert>
            )}

            {groupedModels.map(([providerName, models]) => {
              const selectedInGroup = models.filter(m => selectedModels.includes(m.apiModelId)).length;
              
              return (
                <Accordion key={providerName} defaultExpanded={groupedModels.length <= 3}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {providerName}
                      </Typography>
                      <Chip
                        label={`${models.length} modelos`}
                        size="small"
                        color="default"
                      />
                      {selectedInGroup > 0 && (
                        <Chip
                          label={`${selectedInGroup} selecionados`}
                          size="small"
                          color="success"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      {models.map((model) => (
                        <ModelCheckboxItem
                          key={model.id}
                          model={model}
                          isSelected={selectedModels.includes(model.apiModelId)}
                          onToggle={toggleModel}
                          disabled={!canSelectModels}
                        />
                      ))}
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            {/* Botão para salvar seleção de modelos */}
            {canSelectModels && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={isSaving || !selectedModels.length}
                  sx={{ fontWeight: 'bold', px: 4 }}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Modelos Selecionados'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
