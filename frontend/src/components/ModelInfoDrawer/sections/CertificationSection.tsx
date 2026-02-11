// frontend/src/components/ModelInfoDrawer/sections/CertificationSection.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MODULARIZED: Seção 15 - File Size Limits

import { Box, Typography, Stack, CircularProgress, Alert, useTheme, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import EventIcon from '@mui/icons-material/Event';
import { StatusBadge } from '@/components/Badges';
import { CertificationDetails } from '@/types/ai';

export interface CertificationSectionProps {
  certDetails: CertificationDetails | null;
  loadingCertDetails: boolean;
  isCertified: boolean;
  hasQualityWarning: boolean;
  isUnavailable: boolean;
}

/**
 * Seção de certificação do modelo
 * 
 * Responsabilidades:
 * - Exibir status de certificação
 * - Mostrar detalhes de erros
 * - Ações sugeridas
 */
export function CertificationSection({
  certDetails,
  loadingCertDetails,
  isCertified,
  hasQualityWarning,
  // isUnavailable não é usado atualmente, mas mantido na interface para compatibilidade
}: CertificationSectionProps) {
  const theme = useTheme();

  return (
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
  );
}
