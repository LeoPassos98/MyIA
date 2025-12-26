// frontend/src/features/auditViewer/AuditTrace.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography } from '@mui/material';
import { AuditRecord } from '@/services/auditService';

interface Props {
  audit: AuditRecord;
}

export function AuditTrace({ audit }: Props) {
  return (
    <Box mb={3}>
      <Typography variant="subtitle2" gutterBottom>
        Rastreabilidade
      </Typography>

      <Typography variant="caption" display="block">
        Schema: {audit.schemaVersion}
      </Typography>
      <Typography variant="caption" display="block">
        Audit ID: {audit.auditId}
      </Typography>
      <Typography variant="caption" display="block">
        Message ID: {audit.messageId}
      </Typography>
      <Typography variant="caption" display="block">
        Chat ID: {audit.chatId}
      </Typography>
      <Typography variant="caption" display="block">
        User ID: {audit.userId}
      </Typography>
    </Box>
  );
}
