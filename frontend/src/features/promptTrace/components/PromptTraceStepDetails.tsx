// frontend/src/features/promptTrace/components/PromptTraceStepDetails.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography, Paper, Chip, Divider, Stack } from '@mui/material';
import type { PromptTraceStep } from '../types';

interface Props {
  step: PromptTraceStep;
  /** Só exibe timestamp se houver diferença relevante entre steps */
  showTimestamp?: boolean;
}

/**
 * Detalhes de um step individual
 */
export function PromptTraceStepDetails({ step, showTimestamp = true }: Props) {
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Step #{step.stepNumber}
        </Typography>
        <Chip label={step.role} size="small" variant="outlined" />
      </Stack>

      {/* Conteúdo */}
      <Typography variant="overline" color="text.secondary">
        Conteúdo
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          bgcolor: 'background.default',
          maxHeight: 300,
          overflow: 'auto',
        }}
      >
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
        >
          {step.content}
        </Typography>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* Uso */}
      {step.usage && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Uso de Recursos
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Tokens In
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {step.usage.tokensIn}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Tokens Out
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {step.usage.tokensOut}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {step.usage.totalTokens}
              </Typography>
            </Box>
            {step.usage.latencyMs && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Latência
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {step.usage.latencyMs}ms
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      )}

      {/* Model Info */}
      {step.modelInfo && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Modelo
          </Typography>
          <Typography variant="body2">
            {step.modelInfo.provider} / {step.modelInfo.model}
          </Typography>
        </Box>
      )}

      {/* Timestamp - só exibe se houver diferença relevante entre steps */}
      {showTimestamp && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Timestamp
          </Typography>
          <Typography variant="caption" display="block">
            {new Date(step.timestamp).toLocaleString('pt-BR')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
