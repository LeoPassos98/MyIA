// frontend/src/components/ModelInfoDrawer.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MIGRATED: Fase 3 - Padronização Visual

import { memo, useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import SpeedIcon from '@mui/icons-material/Speed';
import TokenIcon from '@mui/icons-material/Token';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EventIcon from '@mui/icons-material/Event';
import { StatusBadge } from '@/components/Badges';
import { EnrichedAWSModel, CertificationDetails } from '../types/ai';
import { certificationService } from '../services/certificationService';
import { ModelBadgeGroup } from './ModelBadges';
import Alert from '@mui/material/Alert';

export interface ModelInfoDrawerProps {
  open: boolean;
  model: EnrichedAWSModel | null;
  onClose: () => void;
  isCertified?: boolean;
  hasQualityWarning?: boolean;
  isUnavailable?: boolean;
}

/**
 * Drawer lateral profissional para exibir informações detalhadas do modelo
 * 
 * ✅ Vantagens sobre Tooltip:
 * - Mais espaço para informações
 * - Melhor UX em mobile
 * - Sem problemas de posicionamento
 * - Animação suave
 * - Acessível
 * 
 * 📱 Mobile-friendly
 * 🎨 Design limpo e moderno
 * ⚡ Performance otimizada
 */
export const ModelInfoDrawer = memo(({
  open,
  model,
  onClose,
  isCertified = false,
  hasQualityWarning = false,
  isUnavailable = false,
}: ModelInfoDrawerProps) => {
  const theme = useTheme();
  const [certDetails, setCertDetails] = useState<CertificationDetails | null>(null);
  const [loadingCertDetails, setLoadingCertDetails] = useState(false);

  // Buscar detalhes da certificação quando o drawer abrir
  useEffect(() => {
    if (open && model && (isCertified || hasQualityWarning || isUnavailable)) {
      setLoadingCertDetails(true);
      certificationService.getCertificationDetails(model.apiModelId)
        .then(details => {
          setCertDetails(details);
        })
        .catch(error => {
          console.error('Erro ao buscar detalhes da certificação:', error);
        })
        .finally(() => {
          setLoadingCertDetails(false);
        });
    } else {
      setCertDetails(null);
    }
  }, [open, model, isCertified, hasQualityWarning, isUnavailable]);

  if (!model) return null;

  const hasDbInfo = model.isInDatabase !== false;
  const hasCostInfo = model.costPer1kInput > 0 || model.costPer1kOutput > 0;
  const hasContextWindow = model.contextWindow > 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100vw',
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.95)
            : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
        },
      }}
      transitionDuration={250}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Informações do Modelo
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {/* Nome do Modelo */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Nome do Modelo
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
              {model.name}
            </Typography>
          </Box>

          {/* Status Badges */}
          {/* MIGRATED: Usando novo sistema centralizado de badges (ModelBadgeGroup) */}
          {/* Ver: plans/badge-system-centralization.md - Fase 3 */}
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <ModelBadgeGroup
              model={{ apiModelId: model.apiModelId }}
              size="sm"
              spacing={1}
            />
            {/* Manter badges que NÃO são de status */}
            {!hasDbInfo && (
              <StatusBadge
                label="Novo"
                status="info"
                icon={<WarningIcon />}
              />
            )}
            {model.responseStreamingSupported && (
              <StatusBadge
                label="Streaming"
                status="info"
                icon={<SpeedIcon />}
              />
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* ID do Modelo */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TokenIcon fontSize="small" color="primary" />
              ID da API
            </Typography>
            <Box
              sx={{
                p: 1.5,
                background: alpha(theme.palette.text.primary, 0.05),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  wordBreak: 'break-all',
                }}
              >
                {model.apiModelId}
              </Typography>
            </Box>
          </Box>

          {/* Provedor */}
          {model.providerName && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Provedor
              </Typography>
              <Chip
                label={model.providerName}
                variant="outlined"
                size="medium"
              />
            </Box>
          )}

          {/* Context Window */}
          {hasContextWindow && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TokenIcon fontSize="small" color="secondary" />
                Context Window
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {(model.contextWindow / 1024).toFixed(0)}k
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  tokens ({model.contextWindow.toLocaleString()})
                </Typography>
              </Box>
            </Box>
          )}

          {/* Custos */}
          {hasCostInfo && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoneyIcon fontSize="small" color="success" />
                Custos por 1k Tokens
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    p: 1.5,
                    background: alpha(theme.palette.success.main, 0.05),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Input (Entrada)
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ${model.costPer1kInput.toFixed(6)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    background: alpha(theme.palette.warning.main, 0.05),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Output (Saída)
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    ${model.costPer1kOutput.toFixed(6)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Avisos */}
          {!hasDbInfo && (
            <Box
              sx={{
                p: 2,
                background: alpha(theme.palette.warning.main, 0.1),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
              }}
            >
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <WarningIcon fontSize="small" color="warning" sx={{ mt: 0.2 }} />
                <span>
                  <strong>Modelo não cadastrado no banco de dados.</strong>
                  <br />
                  Informações de custo podem estar indisponíveis ou desatualizadas.
                </span>
              </Typography>
            </Box>
          )}

          {/* Informações de Certificação ou Falha */}
          {(isCertified || hasQualityWarning || isUnavailable) && (
            <>
              {/* Alert para Quality Warning */}
              {certDetails?.status === 'quality_warning' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    ⚠️ Modelo Disponível com Limitações
                  </Typography>
                  <Typography variant="body2">
                    {certDetails.categorizedError?.message || 'Este modelo apresentou problemas de qualidade durante os testes.'}
                  </Typography>
                  {certDetails.categorizedError?.suggestedActions && certDetails.categorizedError.suggestedActions.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" fontWeight="bold">
                        Ações sugeridas:
                      </Typography>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {certDetails.categorizedError.suggestedActions.map((action, i) => (
                          <li key={i}>
                            <Typography variant="caption">{action}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Alert>
              )}

              {/* Alert para Indisponível */}
              {certDetails?.status === 'failed' && !certDetails?.isAvailable && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    ❌ Modelo Indisponível
                  </Typography>
                  <Typography variant="body2">
                    {certDetails.categorizedError?.message || certDetails.error || 'Este modelo não está disponível no momento.'}
                  </Typography>
                  {certDetails.categorizedError?.suggestedActions && certDetails.categorizedError.suggestedActions.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" fontWeight="bold">
                        Ações sugeridas:
                      </Typography>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {certDetails.categorizedError.suggestedActions.map((action, i) => (
                          <li key={i}>
                            <Typography variant="caption">{action}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Alert>
              )}

              {/* Box de detalhes da certificação */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  background: isCertified
                    ? alpha(theme.palette.success.main, 0.1)
                    : hasQualityWarning
                    ? alpha(theme.palette.warning.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
                  borderRadius: 1,
                  border: isCertified
                    ? `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                    : hasQualityWarning
                    ? `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                    : `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {isCertified ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : hasQualityWarning ? (
                    <WarningIcon fontSize="small" color="warning" />
                  ) : (
                    <ErrorIcon fontSize="small" color="error" />
                  )}
                  {isCertified ? 'Certificação' : hasQualityWarning ? 'Aviso de Qualidade' : 'Falha na Certificação'}
                </Typography>
                
                {loadingCertDetails ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Carregando detalhes...
                    </Typography>
                  </Box>
                ) : certDetails ? (
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Status
                      </Typography>
                      <StatusBadge
                        label={
                          certDetails.status === 'certified' ? 'Certificado' :
                          certDetails.status === 'quality_warning' ? 'Disponível com Limitações' :
                          'Indisponível'
                        }
                        status={
                          certDetails.status === 'certified' ? 'success' :
                          certDetails.status === 'quality_warning' ? 'warning' :
                          'error'
                        }
                      />
                    </Box>
                    
                    {certDetails.lastChecked && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EventIcon fontSize="inherit" />
                          Última Verificação
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {new Date(certDetails.lastChecked).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    )}
                    
                    {certDetails.errorCategory && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Categoria do Erro
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {certDetails.errorCategory}
                        </Typography>
                      </Box>
                    )}
                    
                    {certDetails.errorSeverity && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Severidade
                        </Typography>
                        <StatusBadge
                          label={certDetails.errorSeverity}
                          status={
                            certDetails.errorSeverity === 'CRITICAL' ? 'error' :
                            certDetails.errorSeverity === 'HIGH' ? 'warning' :
                            'info'
                          }
                        />
                      </Box>
                    )}
                  </Stack>
                ) : isCertified ? (
                  <Typography variant="body2">
                    Este modelo foi testado e validado para uso na plataforma.
                  </Typography>
                ) : hasQualityWarning ? (
                  <Typography variant="body2">
                    Este modelo está disponível mas pode apresentar limitações de qualidade.
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    Este modelo não está disponível no momento.
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
});

ModelInfoDrawer.displayName = 'ModelInfoDrawer';
