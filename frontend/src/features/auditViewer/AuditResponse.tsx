// frontend/src/features/auditViewer/AuditResponse.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography, Paper } from '@mui/material';
import { AuditRecord } from '@/services/auditService';

interface Props {
  audit: AuditRecord;
}

export function AuditResponse({ audit }: Props) {
  if (!audit.content?.assistantMessage) {
    return null;
  }

  return (
    <Box mb={3}>
      <Typography variant="subtitle2" gutterBottom>
        Resposta do Modelo
      </Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" whiteSpace="pre-wrap">
          {audit.content.assistantMessage}
        </Typography>
      </Paper>
    </Box>
  );
}
