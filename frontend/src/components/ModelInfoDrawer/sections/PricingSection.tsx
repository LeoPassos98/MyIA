// frontend/src/components/ModelInfoDrawer/sections/PricingSection.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MODULARIZED: Seção 15 - File Size Limits

import { Box, Typography, Stack, useTheme, alpha } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

export interface PricingSectionProps {
  costPer1kInput: number;
  costPer1kOutput: number;
}

/**
 * Seção de pricing do modelo
 * 
 * Responsabilidades:
 * - Custo por 1k tokens de input
 * - Custo por 1k tokens de output
 */
export function PricingSection({
  costPer1kInput,
  costPer1kOutput,
}: PricingSectionProps) {
  const theme = useTheme();

  return (
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
            ${costPer1kInput.toFixed(6)}
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
            ${costPer1kOutput.toFixed(6)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
