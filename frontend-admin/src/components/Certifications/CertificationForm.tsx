// frontend-admin/src/components/Certifications/CertificationForm.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { certificationApi } from '../../services/certificationApi';
import { useNotification } from '../../hooks/useNotification';
import { logger } from '../../utils/logger';
import { HelpTooltip } from './HelpTooltip';

export function CertificationForm() {
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [certifyType, setCertifyType] = useState<'all' | 'single'>('all');
  const [loading, setLoading] = useState(false);

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const regions = await certificationApi.getRegions();
      setRegions(regions || []);
    } catch (err) {
      console.error('Failed to load regions:', err);
    }
  };

  const handleSubmit = async () => {
    if (selectedRegions.length === 0) {
      showError('Selecione pelo menos uma região');
      return;
    }

    setLoading(true);

    try {
      logger.info('Iniciando certificação para regiões', {
        component: 'CertificationForm',
        regions: selectedRegions
      });
      
      const result = await certificationApi.certifyAll(selectedRegions);
      
      logger.info('Resultado da certificação', {
        component: 'CertificationForm',
        result
      });
      
      const jobCount = result.totalJobs || 1;
      const message = `🚀 ${jobCount} job${jobCount > 1 ? 's' : ''} criado${jobCount > 1 ? 's' : ''} com sucesso! Acompanhe o progresso na tabela abaixo.`;
      
      showSuccess(message);
      setSelectedRegions([]);
    } catch (err: any) {
      logger.error('Erro ao criar job', {
        component: 'CertificationForm',
        error: err.message
      });
      
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Erro ao criar job de certificação';
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6">
            🚀 Certificar Modelos
          </Typography>
          <HelpTooltip
            title="Certificação de Modelos"
            description={
              <Box>
                <Typography variant="caption" display="block" mb={0.5}>
                  A certificação testa se os modelos AWS Bedrock estão disponíveis e funcionando corretamente nas regiões selecionadas.
                </Typography>
                <Typography variant="caption" display="block">
                  O processo é assíncrono e pode levar alguns minutos dependendo do número de modelos e regiões.
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Explicação do processo */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: 'info.lighter',
            border: '1px solid',
            borderColor: 'info.light'
          }}
        >
          <Typography variant="body2" color="info.dark" gutterBottom fontWeight="medium">
            💡 Como funciona:
          </Typography>
          <Typography variant="caption" display="block" color="info.dark">
            1. Selecione as regiões AWS onde deseja certificar os modelos
          </Typography>
          <Typography variant="caption" display="block" color="info.dark">
            2. Um job será criado para cada região selecionada
          </Typography>
          <Typography variant="caption" display="block" color="info.dark">
            3. Cada job testará todos os modelos ativos naquela região
          </Typography>
          <Typography variant="caption" display="block" color="info.dark">
            4. Acompanhe o progresso em tempo real na seção "Histórico" abaixo
          </Typography>
        </Paper>

        <Box display="flex" flexDirection="column" gap={3}>
          {/* Tipo de Certificação */}
          <FormControl fullWidth>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <InputLabel>Tipo de Certificação</InputLabel>
              <HelpTooltip
                title="Tipo de Certificação"
                description="Escolha entre certificar todos os modelos ativos ou apenas um modelo específico. A opção de modelo único estará disponível em breve."
                size="small"
              />
            </Box>
            <Select
              value={certifyType}
              onChange={(e) => setCertifyType(e.target.value as 'all' | 'single')}
              label="Tipo de Certificação"
            >
              <MenuItem value="all">
                <Box>
                  <Typography variant="body2">✨ Todos os Modelos Ativos</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Certifica todos os modelos disponíveis
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="single" disabled>
                <Box>
                  <Typography variant="body2">🎯 Modelo Específico</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Em breve - Certifica apenas um modelo
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Seleção de Regiões */}
          <FormControl fullWidth>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <InputLabel>Regiões AWS</InputLabel>
              <HelpTooltip
                title="Regiões AWS"
                description={
                  <Box>
                    <Typography variant="caption" display="block" mb={0.5}>
                      Selecione uma ou mais regiões AWS onde os modelos serão certificados.
                    </Typography>
                    <Typography variant="caption" display="block">
                      Cada região terá um job separado para melhor controle e paralelização.
                    </Typography>
                  </Box>
                }
                size="small"
              />
            </Box>
            <Select
              multiple
              value={selectedRegions}
              onChange={(e) => setSelectedRegions(e.target.value as string[])}
              label="Regiões AWS"
              renderValue={(selected) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selected.map((value) => {
                    const region = regions.find((r) => r.id === value);
                    return (
                      <Chip 
                        key={value} 
                        label={region?.name || value} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {regions.map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  <Box>
                    <Typography variant="body2">{region.name}</Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {region.id}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {selectedRegions.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                ⚠️ Selecione pelo menos uma região para continuar
              </Typography>
            )}
          </FormControl>

          {/* Botão Certificar */}
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading || selectedRegions.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <RocketLaunchIcon />}
            sx={{
              py: 1.5,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Criando Jobs...' : '🚀 Iniciar Certificação'}
          </Button>

          {/* Informação adicional */}
          <Alert severity="info" variant="outlined">
            <Typography variant="caption" display="block" fontWeight="medium" mb={0.5}>
              ℹ️ Sobre o processo:
            </Typography>
            <Typography variant="caption" display="block">
              • Jobs são processados de forma assíncrona e em paralelo
            </Typography>
            <Typography variant="caption" display="block">
              • A tabela abaixo atualiza automaticamente a cada 3 segundos
            </Typography>
            <Typography variant="caption" display="block">
              • Você receberá notificações quando os jobs forem concluídos
            </Typography>
            <Typography variant="caption" display="block">
              • Clique em um job para ver detalhes de cada modelo certificado
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
}
