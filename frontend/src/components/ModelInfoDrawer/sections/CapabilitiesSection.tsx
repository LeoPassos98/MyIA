// frontend/src/components/ModelInfoDrawer/sections/CapabilitiesSection.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MODULARIZED: Seção 15 - File Size Limits

import { Box, Typography, useTheme, alpha } from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import WarningIcon from '@mui/icons-material/Warning';

export interface CapabilitiesSectionProps {
  contextWindow?: number;
  hasDbInfo: boolean;
}

/**
 * Seção de capacidades do modelo
 * 
 * Responsabilidades:
 * - Context Window
 * - Avisos sobre modelo não cadastrado
 */
export function CapabilitiesSection({
  contextWindow,
  hasDbInfo,
}: CapabilitiesSectionProps) {
  const theme = useTheme();
  const hasContextWindow = (contextWindow ?? 0) > 0;

  return (
    <>
      {/* Context Window */}
      {hasContextWindow && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TokenIcon fontSize="small" color="secondary" />
            Context Window
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {((contextWindow ?? 0) / 1024).toFixed(0)}k
            </Typography>
            <Typography variant="body2" color="text.secondary">
              tokens ({(contextWindow ?? 0).toLocaleString()})
            </Typography>
          </Box>
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
    </>
  );
}
