// frontend/src/components/ModelInfoDrawer/sections/ModelDetails.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MODULARIZED: Seção 15 - File Size Limits

import { Box, Typography, Stack, Chip, useTheme, alpha } from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import WarningIcon from '@mui/icons-material/Warning';
import SpeedIcon from '@mui/icons-material/Speed';
import { StatusBadge } from '@/components/Badges';
import { ModelBadgeGroup } from '@/components/ModelBadges';

export interface ModelDetailsProps {
  name: string;
  apiModelId: string;
  providerName?: string;
  hasDbInfo: boolean;
  responseStreamingSupported?: boolean;
}

/**
 * Seção de detalhes básicos do modelo
 * 
 * Responsabilidades:
 * - Nome do modelo
 * - Badges de status
 * - ID da API
 * - Provedor
 */
export function ModelDetails({
  name,
  apiModelId,
  providerName,
  hasDbInfo,
  responseStreamingSupported,
}: ModelDetailsProps) {
  const theme = useTheme();

  return (
    <>
      {/* Nome do Modelo */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Nome do Modelo
        </Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
          {name}
        </Typography>
      </Box>

      {/* Status Badges */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <ModelBadgeGroup
          model={{ apiModelId }}
          size="sm"
          spacing={1}
        />
        {!hasDbInfo && (
          <StatusBadge
            label="Novo"
            status="info"
            icon={<WarningIcon />}
          />
        )}
        {responseStreamingSupported && (
          <StatusBadge
            label="Streaming"
            status="info"
            icon={<SpeedIcon />}
          />
        )}
      </Stack>

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
            {apiModelId}
          </Typography>
        </Box>
      </Box>

      {/* Provedor */}
      {providerName && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Provedor
          </Typography>
          <Chip
            label={providerName}
            variant="outlined"
            size="medium"
          />
        </Box>
      )}
    </>
  );
}
