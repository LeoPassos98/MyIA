// frontend/src/features/promptTrace/components/PromptTraceUsageSummary.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography, Paper, Grid } from '@mui/material';
import type { PromptTraceUsage } from '../types';

interface Props {
  usage: PromptTraceUsage;
}

/**
 * Resumo de uso total do trace
 */
export function PromptTraceUsageSummary({ usage }: Props) {
  const items = [
    { label: 'Tokens de Entrada', value: usage.tokensIn },
    { label: 'Tokens de Saída', value: usage.tokensOut },
    { label: 'Total de Tokens', value: usage.totalTokens },
    {
      label: 'Custo Estimado',
      value: usage.costInUSD ? `$${usage.costInUSD.toFixed(6)}` : '—',
    },
    {
      label: 'Latência Total',
      value: usage.latencyMs ? `${usage.latencyMs}ms` : '—',
    },
  ];

  return (
    <Box>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={6} sm={4} md={2.4} key={item.label}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'background.default',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {item.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
