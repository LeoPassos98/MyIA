// frontend/src/features/settings/components/providers/AWSProviderPanel.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useMemo, memo, useEffect, useCallback } from 'react';
import {
  Box, TextField, Button, Alert, CircularProgress,
  FormGroup, FormControlLabel, Checkbox, Typography, Divider,
  LinearProgress, Chip, Select, MenuItem, ListSubheader,
  Accordion, AccordionSummary, AccordionDetails, InputAdornment,
  IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EditIcon from '@mui/icons-material/Edit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import { useTheme } from '@mui/material/styles';
import { useAWSConfig } from '../../hooks/useAWSConfig';
import { EnrichedAWSModel } from '../../../../types/ai';
import { certificationService } from '../../../../services/certificationService';
import { OptimizedTooltip } from '../../../../components/OptimizedTooltip';
import { ModelInfoDrawer } from '../../../../components/ModelInfoDrawer';
import { CertificationProgressDialog, ModelCertificationProgress } from '../../../../components/CertificationProgressDialog';

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

// ✅ OTIMIZAÇÃO: Componente memoizado para item de modelo individual
// Substituído Tooltip pesado do MUI por botão de info que abre drawer
const ModelCheckboxItem = memo(({
  model,
  isSelected,
  onToggle,
  disabled,
  isCertified,
  hasQualityWarning,
  isUnavailable,
  onShowInfo
}: {
  model: EnrichedAWSModel;
  isSelected: boolean;
  onToggle: (id: string) => void;
  disabled: boolean;
  isCertified: boolean;
  hasQualityWarning: boolean;
  isUnavailable: boolean;
  onShowInfo: (model: EnrichedAWSModel) => void;
}) => {
  const hasDbInfo = model.isInDatabase !== false;
  const hasCostInfo = model.costPer1kInput > 0 || model.costPer1kOutput > 0;
  
  return (
    <FormControlLabel
      disabled={disabled}
      control={
        <Checkbox
          // ✅ CORREÇÃO: O estado visual do checkbox deve refletir apenas isSelected
          // A lógica de desabilitar modelos failed é feita via disabled={isUnavailable}
          // Isso garante que:
          // - Modelos certified/quality_warning: checkbox marca/desmarca normalmente
          // - Modelos failed: checkbox sempre desmarcado (isSelected será false) e desabilitado
          checked={isSelected}
          onChange={() => onToggle(model.apiModelId)}
          tabIndex={0}
          disabled={disabled || isUnavailable}
        />
      }
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{model.name}</Typography>
              {isCertified && (
                <Chip
                  label="✅ Certificado"
                  size="small"
                  color="success"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
              {hasQualityWarning && (
                <Chip
                  label="⚠️ Qualidade"
                  size="small"
                  color="warning"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
              {isUnavailable && (
                <Chip
                  label="❌ Indisponível"
                  size="small"
                  color="error"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
              {!hasDbInfo && (
                <Chip
                  label="Novo"
                  size="small"
                  color="info"
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
          {/* ✅ Botão de info que abre drawer profissional */}
          <OptimizedTooltip content="Ver detalhes do modelo" placement="left" delay={500}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onShowInfo(model);
              }}
              sx={{ ml: 1 }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </OptimizedTooltip>
        </Box>
      }
    />
  );
});

ModelCheckboxItem.displayName = 'ModelCheckboxItem';

export default function AWSProviderPanel() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [certifiedModels, setCertifiedModels] = useState<string[]>([]);
  const [unavailableModels, setUnavailableModels] = useState<string[]>([]);
  const [qualityWarningModels, setQualityWarningModels] = useState<string[]>([]);
  
  // ✅ Estados para o diálogo de progresso de certificação
  const [certificationProgress, setCertificationProgress] = useState<ModelCertificationProgress[]>([]);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [canCancelCertification, setCanCancelCertification] = useState(false);
  const [certificationAborted, setCertificationAborted] = useState(false);
  
  // ✅ Estado para o drawer de informações do modelo
  const [selectedModelForInfo, setSelectedModelForInfo] = useState<EnrichedAWSModel | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // ✅ OTIMIZAÇÃO: Debounce do searchTerm (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Estados para gerenciar credenciais existentes
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  
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

  // Detectar credenciais existentes ao carregar
  useEffect(() => {
    if (formState.accessKey && formState.accessKey.length > 0) {
      setHasExistingCredentials(true);
      setIsEditingCredentials(false);
    } else {
      setHasExistingCredentials(false);
      setIsEditingCredentials(false);
    }
  }, [formState.accessKey]);

  // Buscar modelos certificados, indisponíveis (failed) e com warning de qualidade
  useEffect(() => {
    async function loadCertifications() {
      try {
        console.log('[AWSProviderPanel] 🔍 DEBUG: Carregando certificações...');
        // ✅ CORREÇÃO: Usar getAllFailedModels() para pegar TODOS os modelos com status 'failed'
        // Isso garante que o badge vermelho "❌ Indisponível" apareça para todos os modelos falhados
        const [certified, allFailed, warnings] = await Promise.all([
          certificationService.getCertifiedModels(),
          certificationService.getAllFailedModels(),
          certificationService.getQualityWarningModels()
        ]);
        console.log('[AWSProviderPanel] 🔍 DEBUG: Certificados:', certified);
        console.log('[AWSProviderPanel] 🔍 DEBUG: Todos os Failed:', allFailed);
        console.log('[AWSProviderPanel] 🔍 DEBUG: Warnings:', warnings);
        setCertifiedModels(certified);
        setUnavailableModels(allFailed); // Usar lista completa de modelos failed
        setQualityWarningModels(warnings);
      } catch (error) {
        console.error('Erro ao carregar certificações:', error);
      }
    }
    loadCertifications();
  }, []);

  // ✅ Handler otimizado para abrir drawer de informações
  const handleShowModelInfo = useCallback((model: EnrichedAWSModel) => {
    setSelectedModelForInfo(model);
    setIsDrawerOpen(true);
  }, []);

  // Handler para certificar modelos selecionados com progresso detalhado
  const handleCertifySelected = async () => {
    // Inicializar progresso para cada modelo
    const initialProgress: ModelCertificationProgress[] = selectedModels.map(modelId => {
      const model = availableModels.find(m => m.apiModelId === modelId);
      return {
        modelId,
        modelName: model?.name || modelId,
        status: 'pending' as const
      };
    });
    
    setCertificationProgress(initialProgress);
    setIsProgressDialogOpen(true);
    setCanCancelCertification(true);
    setCertificationAborted(false);

    try {
      // Certificar modelos um por vez para mostrar progresso
      for (let i = 0; i < selectedModels.length; i++) {
        // Verificar se foi cancelado
        if (certificationAborted) {
          // Marcar modelos restantes como cancelados
          setCertificationProgress(prev =>
            prev.map((p, idx) =>
              idx >= i ? { ...p, status: 'error' as const, error: 'Cancelado pelo usuário' } : p
            )
          );
          break;
        }
        
        const modelId = selectedModels[i];
        const startTime = Date.now();
        
        // Atualizar status para "running"
        setCertificationProgress(prev =>
          prev.map(p => p.modelId === modelId ? { ...p, status: 'running' as const, startTime } : p)
        );
        
        try {
          await certificationService.certifyModel(modelId);
          const endTime = Date.now();
          
          // Buscar detalhes da certificação para obter o status
          const certDetails = await certificationService.getCertificationDetails(modelId);
          
          // Sucesso
          setCertificationProgress(prev =>
            prev.map(p => p.modelId === modelId ? { 
              ...p, 
              status: 'success' as const, 
              endTime,
              result: certDetails || undefined
            } : p)
          );
        } catch (error: any) {
          const endTime = Date.now();
          const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
          
          // Erro
          setCertificationProgress(prev =>
            prev.map(p => p.modelId === modelId ? {
              ...p,
              status: 'error' as const,
              error: errorMessage,
              endTime
            } : p)
          );
        }
      }

      // ✅ FIX: Após certificar, buscar listas atualizadas do backend com forceRefresh
      // Isso garante que o estado local seja sincronizado com o backend
      // e os badges permaneçam após reload da página
      // ✅ CORREÇÃO: Usar getAllFailedModels() para pegar TODOS os modelos com status 'failed'
      const [updatedCertifiedModels, updatedAllFailedModels, updatedWarningModels] = await Promise.all([
        certificationService.getCertifiedModels(true),
        certificationService.getAllFailedModels(true),
        certificationService.getQualityWarningModels(true)
      ]);
      setCertifiedModels(updatedCertifiedModels);
      setUnavailableModels(updatedAllFailedModels); // Usar lista completa de modelos failed
      setQualityWarningModels(updatedWarningModels);
    } catch (error) {
      console.error('Erro ao certificar modelos:', error);
    } finally {
      setCanCancelCertification(false);
    }
  };
  
  // Handler para cancelar certificação
  const handleCancelCertification = () => {
    setCertificationAborted(true);
    setCanCancelCertification(false);
  };
  
  // Handler para fechar diálogo de progresso
  const handleCloseProgressDialog = () => {
    setIsProgressDialogOpen(false);
    setCertificationProgress([]);
    setCertificationAborted(false);
  };

  // ✅ OTIMIZAÇÃO: Agrupar modelos por provedor e filtrar por busca (com debounce)
  const groupedModels = useMemo(() => {
    const filtered = availableModels.filter(model => {
      if (!debouncedSearchTerm) return true;
      const search = debouncedSearchTerm.toLowerCase();
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
  }, [availableModels, debouncedSearchTerm]);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const canSelectModels = validationStatus === 'valid';

  return (
    <>
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
          
          {/* Alert quando credenciais já existem */}
          {hasExistingCredentials && !isEditingCredentials && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setIsEditingCredentials(true)}
                >
                  Alterar Key
                </Button>
              }
            >
              <strong>Credenciais AWS já cadastradas</strong>
              <br />
              Você já possui credenciais configuradas para este provider.
              Clique em "Alterar Key" se deseja modificá-las.
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* ✅ Substituído Tooltip do MUI por OptimizedTooltip */}
            <OptimizedTooltip content="ID da sua Access Key AWS. Nunca compartilhe com terceiros.">
              <TextField
                fullWidth
                label="Access Key ID"
                placeholder="Access Key ID - Ex: AKIAIOSFODNN7EXAMPLE (16 caracteres após AKIA)"
                value={formState.accessKey}
                onChange={e => handleFieldChange('accessKey', e.target.value.trim())}
                disabled={
                  validationStatus === 'validating' ||
                  (hasExistingCredentials && !isEditingCredentials)
                }
                InputProps={{
                  readOnly: hasExistingCredentials && !isEditingCredentials,
                  endAdornment: hasExistingCredentials && !isEditingCredentials && (
                    <InputAdornment position="end">
                      <CheckCircleIcon color="success" />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 1 }}
                inputProps={{
                  autoComplete: 'username'
                }}
              />
            </OptimizedTooltip>
            
            <OptimizedTooltip content="Sua chave secreta AWS. Nunca será exibida após salvar.">
              <TextField
                fullWidth
                type="password"
                label="Secret Access Key"
                placeholder={formState.secretKey ? '********' : 'Secret Access Key - Ex: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY (40 caracteres)'}
                value={formState.secretKey}
                onChange={e => handleFieldChange('secretKey', e.target.value.trim())}
                disabled={
                  validationStatus === 'validating' ||
                  (hasExistingCredentials && !isEditingCredentials)
                }
                InputProps={{
                  readOnly: hasExistingCredentials && !isEditingCredentials,
                  endAdornment: hasExistingCredentials && !isEditingCredentials && (
                    <InputAdornment position="end">
                      <CheckCircleIcon color="success" />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 1 }}
                inputProps={{
                  autoComplete: 'current-password'
                }}
              />
            </OptimizedTooltip>
            
            <OptimizedTooltip content="Região AWS onde seus modelos estão disponíveis. Pode ser alterada a qualquer momento.">
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
            </OptimizedTooltip>
            
            {/* Botão para salvar apenas a região quando credenciais já existem */}
            {hasExistingCredentials && !isEditingCredentials && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleSave}
                  disabled={isSaving}
                  size="small"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Região'}
                </Button>
                
                {isSaving && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Carregando modelos da nova região...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Botões condicionais baseados no estado de edição */}
            {hasExistingCredentials && !isEditingCredentials ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsEditingCredentials(true)}
                  startIcon={<EditIcon />}
                  sx={{ fontWeight: 'bold', px: 3 }}
                >
                  Alterar Credenciais
                </Button>
                <Chip icon={<CheckCircleIcon />} label="Credenciais Válidas" color="success" />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <OptimizedTooltip content="Testa as credenciais e salva se forem válidas.">
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={async () => {
                        await handleValidate();
                        if (validationStatus === 'valid') {
                          await handleSave();
                          setHasExistingCredentials(true);
                          setIsEditingCredentials(false);
                        }
                      }}
                      disabled={validationStatus === 'validating' || !formState.accessKey || !formState.secretKey}
                      sx={{ fontWeight: 'bold', px: 4, transition: 'all 0.2s' }}
                    >
                      {validationStatus === 'validating' || isSaving ? 'Testando...' : 'Testar e Salvar'}
                    </Button>
                  </span>
                </OptimizedTooltip>
                {isEditingCredentials && (
                  <Button
                    variant="text"
                    color="secondary"
                    onClick={() => {
                      setIsEditingCredentials(false);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
                {validationStatus === 'valid' && (
                  <Chip icon={<CheckCircleIcon />} label="Válido" color="success" />
                )}
                {validationStatus === 'invalid' && (
                  <Chip icon={<ErrorIcon />} label="Inválido" color="error" />
                )}
              </Box>
            )}

            {validationStatus === 'validating' && <LinearProgress sx={{ mt: 1 }} />}

            {validationResult?.suggestion && (
              <Alert severity="info" icon={<WarningIcon />}>
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
              ? 'Selecione os modelos que deseja usar. Clique no ícone ℹ️ para ver detalhes.'
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
                      <SearchIcon />
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
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
                            isCertified={certifiedModels.includes(model.apiModelId)}
                            hasQualityWarning={qualityWarningModels.includes(model.apiModelId)}
                            isUnavailable={unavailableModels.includes(model.apiModelId)}
                            onShowInfo={handleShowModelInfo}
                          />
                        ))}
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              {/* Botões para salvar e certificar */}
              {canSelectModels && (
                <>
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <OptimizedTooltip content="Certifica os modelos selecionados para garantir que funcionam corretamente">
                        <span>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleCertifySelected}
                            disabled={!canSelectModels || selectedModels.length === 0 || isProgressDialogOpen}
                            startIcon={isProgressDialogOpen ? <CircularProgress size={20} /> : <VerifiedUserIcon />}
                            sx={{ fontWeight: 'bold', px: 3 }}
                          >
                            {isProgressDialogOpen ? 'Certificando...' : `Certificar ${selectedModels.length} Modelos`}
                          </Button>
                        </span>
                      </OptimizedTooltip>
                      <OptimizedTooltip
                        content="A certificação testa cada modelo individualmente e salva o resultado permanentemente. Você não precisa salvar a seleção de modelos para manter a certificação."
                        placement="left"
                      >
                        <HelpOutlineIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
                      </OptimizedTooltip>
                    </Box>
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
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                    💡 A certificação é salva automaticamente e não depende de salvar a seleção de modelos.
                  </Typography>
                </>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* ✅ Drawer profissional para informações do modelo */}
      <ModelInfoDrawer
        open={isDrawerOpen}
        model={selectedModelForInfo}
        onClose={() => setIsDrawerOpen(false)}
        isCertified={selectedModelForInfo ? certifiedModels.includes(selectedModelForInfo.apiModelId) : false}
        hasQualityWarning={selectedModelForInfo ? qualityWarningModels.includes(selectedModelForInfo.apiModelId) : false}
        isUnavailable={selectedModelForInfo ? unavailableModels.includes(selectedModelForInfo.apiModelId) : false}
      />
      
      {/* ✅ Diálogo de progresso de certificação */}
      <CertificationProgressDialog
        open={isProgressDialogOpen}
        models={certificationProgress}
        onCancel={handleCancelCertification}
        onClose={handleCloseProgressDialog}
        canCancel={canCancelCertification}
      />
    </>
  );
}
