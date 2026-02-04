// frontend/src/features/chat/components/ControlPanel/RegionalCertificationBadges.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * RegionalCertificationBadges Component
 *
 * Componente para exibir múltiplos badges de certificação, um por região AWS.
 * Mostra o status de certificação de um modelo em cada região suportada.
 *
 * @module features/chat/components/ControlPanel/RegionalCertificationBadges
 */

import { Box, CircularProgress, Typography, Tooltip, Chip } from '@mui/material';
import { Public, Error as ErrorIcon } from '@mui/icons-material';
import { CertificationBadge } from './CertificationBadge';
import { useRegionalCertifications, useRegionalCertificationStats } from '../../../../hooks/useRegionalCertifications';
import { AWSRegion, AWS_REGION_NAMES } from '../../../../types/ai';

/**
 * Props do componente RegionalCertificationBadges
 */
export interface RegionalCertificationBadgesProps {
  /** ID completo do modelo (ex: 'anthropic:claude-3-5-sonnet-20241022') */
  modelId: string;
  /** ID do provider (ex: 'aws-bedrock') */
  providerId: string;
  /** Habilitar auto-refresh a cada 30 segundos */
  autoRefresh?: boolean;
  /** Callback ao clicar em um badge */
  onBadgeClick?: (region: AWSRegion) => void;
  /** Mostrar estatísticas resumidas */
  showStats?: boolean;
  /** Layout: horizontal ou vertical */
  layout?: 'horizontal' | 'vertical';
}

/**
 * Componente de badges de certificação regional
 * 
 * Exibe múltiplos badges, um por região AWS, mostrando o status de certificação
 * de um modelo em cada região. Suporta auto-refresh e tooltips informativos.
 * 
 * @example
 * ```tsx
 * // Uso básico
 * <RegionalCertificationBadges
 *   modelId="anthropic:claude-3-5-sonnet-20241022"
 *   providerId="aws-bedrock"
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Com auto-refresh e callback
 * <RegionalCertificationBadges
 *   modelId="anthropic:claude-3-5-sonnet-20241022"
 *   providerId="aws-bedrock"
 *   autoRefresh={true}
 *   onBadgeClick={(region) => console.log('Clicked:', region)}
 *   showStats={true}
 * />
 * ```
 */
export function RegionalCertificationBadges({
  modelId,
  providerId,
  autoRefresh = false,
  onBadgeClick,
  showStats = false,
  layout = 'horizontal'
}: RegionalCertificationBadgesProps) {
  // Buscar certificações regionais
  const { certifications, isLoading, error } = useRegionalCertifications(
    modelId,
    providerId,
    { autoRefresh }
  );

  // Buscar estatísticas se necessário
  const stats = useRegionalCertificationStats(modelId, providerId);

  // Estado de loading
  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Carregando certificações regionais...
        </Typography>
      </Box>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <ErrorIcon color="error" fontSize="small" />
        <Typography variant="caption" color="error">
          Erro ao carregar certificações: {error.message}
        </Typography>
      </Box>
    );
  }

  // Sem certificações
  if (certifications.length === 0) {
    return (
      <Tooltip title="Este modelo ainda não foi testado em nenhuma região">
        <Chip
          icon={<Public sx={{ fontSize: 14 }} />}
          label="Não Testado"
          size="small"
          color="default"
        />
      </Tooltip>
    );
  }

  return (
    <Box>
      {/* Estatísticas resumidas */}
      {showStats && stats.totalRegions > 0 && (
        <Box mb={1}>
          <Typography variant="caption" color="text.secondary">
            Certificado em {stats.certifiedCount} de {stats.totalRegions} regiões ({stats.certificationRate}%)
          </Typography>
        </Box>
      )}

      {/* Badges por região */}
      <Box
        display="flex"
        flexDirection={layout === 'horizontal' ? 'row' : 'column'}
        gap={1}
        flexWrap="wrap"
      >
        {certifications.map((cert) => (
          <Tooltip
            key={cert.region}
            title={
              <Box>
                <Typography variant="caption" fontWeight="bold">
                  {AWS_REGION_NAMES[cert.region]}
                </Typography>
                {cert.lastTestedAt && (
                  <Typography variant="caption" display="block">
                    Testado em: {new Date(cert.lastTestedAt).toLocaleString('pt-BR')}
                  </Typography>
                )}
                {cert.attempts !== undefined && (
                  <Typography variant="caption" display="block">
                    Tentativas: {cert.attempts}
                  </Typography>
                )}
                {cert.successRate !== undefined && (
                  <Typography variant="caption" display="block">
                    Taxa de sucesso: {cert.successRate}%
                  </Typography>
                )}
                {cert.error && (
                  <Typography variant="caption" display="block" color="error">
                    Erro: {cert.error}
                  </Typography>
                )}
              </Box>
            }
            arrow
            placement="top"
          >
            <Box>
              <CertificationBadge
                status={cert.status}
                lastChecked={cert.lastTestedAt}
                successRate={cert.successRate}
                errorCategory={cert.errorCategory}
                onClick={onBadgeClick ? () => onBadgeClick(cert.region) : undefined}
                size="small"
              />
              <Typography
                variant="caption"
                display="block"
                textAlign="center"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {cert.region}
              </Typography>
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Componente auxiliar para exibir badge resumido de certificação regional
 * Mostra apenas um badge com estatísticas gerais
 * 
 * @example
 * ```tsx
 * <RegionalCertificationSummaryBadge
 *   modelId="anthropic:claude-3-5-sonnet-20241022"
 *   providerId="aws-bedrock"
 *   onClick={() => setShowDetails(true)}
 * />
 * ```
 */
export interface RegionalCertificationSummaryBadgeProps {
  /** ID completo do modelo */
  modelId: string;
  /** ID do provider */
  providerId: string;
  /** Callback ao clicar no badge */
  onClick?: () => void;
}

export function RegionalCertificationSummaryBadge({
  modelId,
  providerId,
  onClick
}: RegionalCertificationSummaryBadgeProps) {
  const stats = useRegionalCertificationStats(modelId, providerId);
  const { isLoading, error } = useRegionalCertifications(modelId, providerId);

  if (isLoading) {
    return <CircularProgress size={16} />;
  }

  if (error || stats.totalRegions === 0) {
    return (
      <Chip
        icon={<Public sx={{ fontSize: 14 }} />}
        label="Não Testado"
        size="small"
        color="default"
        onClick={onClick}
      />
    );
  }

  // Determinar cor baseado na taxa de certificação
  const color = stats.certificationRate === 100 ? 'success' :
                stats.certificationRate >= 75 ? 'warning' :
                stats.certificationRate > 0 ? 'error' : 'default';

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" fontWeight="bold">
            Certificação Regional
          </Typography>
          <Typography variant="caption" display="block">
            Certificado: {stats.certifiedCount}/{stats.totalRegions} regiões
          </Typography>
          <Typography variant="caption" display="block">
            Falhas: {stats.failedCount}
          </Typography>
          <Typography variant="caption" display="block">
            Avisos: {stats.warningCount}
          </Typography>
          <Typography variant="caption" display="block">
            Não testado: {stats.notTestedCount}
          </Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <Chip
        icon={<Public sx={{ fontSize: 14 }} />}
        label={`${stats.certificationRate}% Certificado`}
        size="small"
        color={color}
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? {
            opacity: 0.8,
            transform: 'scale(1.02)',
            transition: 'all 0.2s ease-in-out'
          } : {}
        }}
      />
    </Tooltip>
  );
}
