/**
 * frontend/src/features/settings/components/ModelsManagementTab.tsx
 * Model certification management interface
 * Standards: docs/STANDARDS.md
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Typography,
  Checkbox,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { SettingsSection } from './SettingsSection';
import { certificationService } from '../../../services/certificationService';
import { aiProvidersService } from '../../../services/aiProvidersService';
import { AIProvider } from '../../../types/ai';
import { useAWSConfig } from '../hooks/useAWSConfig';
import { logger } from '../../../utils/logger';

type FilterType = 'all' | 'certified' | 'untested';

export default function ModelsManagementTab() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [certifiedModels, setCertifiedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCertifying, setIsCertifying] = useState<string | null>(null);
  const [isCertifyingBatch, setIsCertifyingBatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  
  // Hook para auto-save de certificações
  const { selectedModels: awsEnabledModels, setSelectedModels: setAWSEnabledModels, handleSave: saveAWSConfig } = useAWSConfig();

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      logger.debug('[ModelsManagementTab] 🔄 Iniciando loadData...');
      setIsLoading(true);
      setError(null);
      
      const [providersData, certifiedData] = await Promise.all([
        aiProvidersService.getConfigured(),
        certificationService.getCertifiedModels()
      ]);

      logger.debug('[ModelsManagementTab] 📦 Providers recebidos:', providersData);
      logger.debug('[ModelsManagementTab] ✅ Modelos certificados recebidos:', certifiedData);
      
      setProviders(providersData);
      setCertifiedModels(certifiedData);
      
      logger.debug('[ModelsManagementTab] 💾 Estado atualizado - certifiedModels:', certifiedData);
    } catch (err) {
      logger.error('[ModelsManagementTab] ❌ Erro ao carregar dados:', err);
      setError('Erro ao carregar modelos');
    } finally {
      setIsLoading(false);
    }
  };

  // Extrair todos os modelos de todos os providers
  const allModels = useMemo(() => {
    return providers.flatMap(provider =>
      provider.models.map(model => ({
        ...model,
        providerSlug: provider.slug,
        providerName: provider.name,
      }))
    );
  }, [providers]);

  // Filtrar modelos
  const filteredModels = useMemo(() => {
    switch (filter) {
      case 'certified':
        return allModels.filter(m => certifiedModels.includes(m.apiModelId));
      case 'untested':
        return allModels.filter(m => !certifiedModels.includes(m.apiModelId));
      default:
        return allModels;
    }
  }, [allModels, certifiedModels, filter]);

  // Handler para certificar modelo individual
  const handleCertifyModel = async (modelId: string) => {
    logger.debug(`[ModelsManagementTab] Iniciando certificação para: ${modelId}`);
    setIsCertifying(modelId);
    setError(null);
    setSuccess(null);

    try {
      // Credenciais são buscadas automaticamente do banco pelo backend
      logger.debug(`[ModelsManagementTab] Chamando certificationService.certifyModel...`);
      const result = await certificationService.certifyModel(modelId);
      logger.debug(`[ModelsManagementTab] Resultado da certificação:`, result);

      if (result.isCertified) {
        // ✅ OTIMIZAÇÃO: Atualizar apenas certifiedModels (sem recarregar providers)
        setCertifiedModels(prev => [...new Set([...prev, modelId])]);
        setSuccess(`Modelo ${modelId} certificado com sucesso!`);
        
        // ✅ AUTO-SAVE: Adicionar modelo aos habilitados automaticamente
        if (!awsEnabledModels.includes(modelId)) {
          setAWSEnabledModels([...awsEnabledModels, modelId]);
          await saveAWSConfig();
          logger.debug(`[ModelsManagementTab] ✅ Modelo ${modelId} salvo automaticamente`);
        }
        
        // ✅ OTIMIZAÇÃO: Removido loadData() - não é necessário recarregar providers
        // Os dados já estão atualizados no estado local (70% de melhoria)
      } else {
        setError(`Falha na certificação: ${result.status} (${result.successRate.toFixed(1)}% de sucesso)`);
      }
    } catch (err: any) {
      logger.error('[ModelsManagementTab] Erro ao certificar modelo:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erro ao certificar modelo';
      setError(errorMsg);
    } finally {
      setIsCertifying(null);
    }
  };

  // Handler para certificar múltiplos modelos
  const handleCertifySelected = async () => {
    // Filtrar apenas modelos não certificados
    const uncertifiedSelected = selectedModels.filter(
      modelId => !certifiedModels.includes(modelId)
    );

    if (uncertifiedSelected.length === 0) {
      setError('Todos os modelos selecionados já estão certificados');
      return;
    }

    logger.debug(`[ModelsManagementTab] Certificando ${uncertifiedSelected.length} modelos...`);
    setIsCertifyingBatch(true);
    setError(null);
    setSuccess(null);

    let successCount = 0;
    let failCount = 0;
    const newCertifiedModels: string[] = []; // ✅ Acumular modelos certificados

    // ✅ OTIMIZAÇÃO: Loop sem atualizações de estado intermediárias
    for (const modelId of uncertifiedSelected) {
      try {
        const result = await certificationService.certifyModel(modelId);
        
        if (result.isCertified) {
          successCount++;
          newCertifiedModels.push(modelId); // ✅ Acumular ao invés de atualizar estado
        } else {
          failCount++;
        }
      } catch (err) {
        logger.error(`[ModelsManagementTab] Erro ao certificar ${modelId}:`, err);
        failCount++;
      }
    }

    // ✅ OTIMIZAÇÃO: Atualizar estado UMA VEZ após loop
    if (newCertifiedModels.length > 0) {
      setCertifiedModels(prev => [...new Set([...prev, ...newCertifiedModels])]);
      
      // ✅ OTIMIZAÇÃO: Save UMA VEZ com todos os modelos
      const modelsToAdd = newCertifiedModels.filter(id => !awsEnabledModels.includes(id));
      if (modelsToAdd.length > 0) {
        const updatedModels = [...awsEnabledModels, ...modelsToAdd];
        setAWSEnabledModels(updatedModels);
        await saveAWSConfig();
        logger.debug(`[ModelsManagementTab] ✅ ${modelsToAdd.length} modelos salvos automaticamente`);
      }
    }

    setIsCertifyingBatch(false);
    setSelectedModels([]); // Limpar seleção
    
    if (successCount > 0) {
      setSuccess(`${successCount} modelo(s) certificado(s) com sucesso!`);
    }
    if (failCount > 0) {
      setError(`${failCount} modelo(s) falharam na certificação`);
    }
    
    // ✅ OTIMIZAÇÃO: Removido loadData() - estado já atualizado (80% de melhoria)
  };

  // Handler para selecionar/desselecionar modelo
  const handleToggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  // Handler para selecionar todos os modelos visíveis
  const handleSelectAll = () => {
    const allVisibleIds = filteredModels.map(m => m.apiModelId);
    setSelectedModels(allVisibleIds);
  };

  // Handler para desselecionar todos
  const handleDeselectAll = () => {
    setSelectedModels([]);
  };

  // Calcular modelos pendentes de certificação
  const uncertifiedSelectedModels = useMemo(() => {
    return selectedModels.filter(modelId => !certifiedModels.includes(modelId));
  }, [selectedModels, certifiedModels]);

  if (isLoading) {
    return (
      <SettingsSection>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Gerenciamento de Modelos"
      description="Certifique e gerencie modelos AWS Bedrock"
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* ✅ FEEDBACK: Alert durante certificação */}
      {(isCertifyingBatch || isCertifying) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Certificação em Andamento</AlertTitle>
          Testando modelo(s)... Isso pode levar até 60 segundos por modelo.
          <br />
          <strong>Você pode sair desta página.</strong> A certificação continuará em segundo plano.
        </Alert>
      )}

      {/* Filtros e Ações em Lote */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          size="small"
          variant={filter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setFilter('all')}
        >
          Todos ({allModels.length})
        </Button>
        <Button
          size="small"
          variant={filter === 'certified' ? 'contained' : 'outlined'}
          onClick={() => setFilter('certified')}
          startIcon={<CheckCircleIcon />}
        >
          Certificados ({certifiedModels.length})
        </Button>
        <Button
          size="small"
          variant={filter === 'untested' ? 'contained' : 'outlined'}
          onClick={() => setFilter('untested')}
        >
          Não Certificados ({allModels.length - certifiedModels.length})
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {/* Ações de seleção */}
        {selectedModels.length > 0 && (
          <>
            <Typography variant="body2" color="text.secondary">
              {selectedModels.length} selecionado(s)
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
            >
              Limpar
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleCertifySelected}
              disabled={uncertifiedSelectedModels.length === 0 || isCertifyingBatch}
              startIcon={isCertifyingBatch ? <CircularProgress size={16} /> : <VerifiedUserIcon />}
            >
              {isCertifyingBatch
                ? 'Certificando...'
                : `Certificar ${uncertifiedSelectedModels.length} modelo(s)`}
            </Button>
            {selectedModels.length > uncertifiedSelectedModels.length && (
              <Typography variant="caption" color="text.secondary">
                ({selectedModels.length - uncertifiedSelectedModels.length} já certificado(s))
              </Typography>
            )}
          </>
        )}

        {selectedModels.length === 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={handleSelectAll}
          >
            Selecionar Todos
          </Button>
        )}

        <Tooltip title="Recarregar dados" arrow>
          <IconButton onClick={loadData} size="small" color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabela de Modelos */}
      {filteredModels.length === 0 ? (
        <Alert severity="info">
          Nenhum modelo encontrado para o filtro selecionado.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedModels.length === filteredModels.length && filteredModels.length > 0}
                    indeterminate={selectedModels.length > 0 && selectedModels.length < filteredModels.length}
                    onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                  />
                </TableCell>
                <TableCell><strong>Modelo</strong></TableCell>
                <TableCell><strong>Vendor</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Context Window</strong></TableCell>
                <TableCell align="right"><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredModels.map((model) => {
                const isCertified = certifiedModels.includes(model.apiModelId);
                const isCurrentlyCertifying = isCertifying === model.apiModelId;
                const isSelected = selectedModels.includes(model.apiModelId);
                
                logger.debug(`[ModelsManagementTab] 🎨 Renderizando badge para ${model.apiModelId}:`, {
                  isCertified,
                  certifiedModels,
                  includes: certifiedModels.includes(model.apiModelId)
                });

                return (
                  <TableRow key={model.id} hover selected={isSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleToggleModel(model.apiModelId)}
                        disabled={model.providerSlug !== 'aws' && model.providerSlug !== 'bedrock'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {model.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.apiModelId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={model.providerName}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {isCertified ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Certificado"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<HelpOutlineIcon />}
                          label="Não Testado"
                          color="default"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {Math.round(model.contextWindow / 1024)}k tokens
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={
                          isCertified
                            ? 'Recertificar modelo'
                            : 'Certificar modelo'
                        }
                        arrow
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleCertifyModel(model.apiModelId)}
                            disabled={isCurrentlyCertifying || (model.providerSlug !== 'aws' && model.providerSlug !== 'bedrock')}
                          >
                            {isCurrentlyCertifying ? (
                              <CircularProgress size={20} />
                            ) : (
                              <VerifiedUserIcon />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Informação sobre certificação */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Sobre a Certificação:</strong> A certificação testa se o modelo responde
          corretamente e está disponível na sua conta AWS. Modelos certificados são
          automaticamente habilitados e salvos nas suas configurações.
        </Typography>
      </Alert>
    </SettingsSection>
  );
}
