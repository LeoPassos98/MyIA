// frontend/src/features/promptTrace/components/PromptTraceHeader.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography } from '@mui/material';
import type { PromptTraceRecord } from '../types';

interface Props {
  trace: PromptTraceRecord;
}

/**
 * Cabeçalho minimalista do Prompt Trace
 */
export function PromptTraceHeader({ trace }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Prompt Trace
      </Typography>

      <Typography variant="caption" color="text.secondary">
        Trace viewer — {trace.traceId}
      </Typography>
    </Box>
  );
}
