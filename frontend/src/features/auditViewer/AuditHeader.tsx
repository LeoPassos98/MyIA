// frontend/src/features/auditViewer/AuditHeader.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography, Chip } from '@mui/material';
import { AuditRecord } from '@/services/auditService';

interface Props {
  audit: AuditRecord;
}

export function AuditHeader({ audit }: Props) {
  return (
    <Box p={2}>
      <Typography variant="h6">Auditoria da Resposta da IA</Typography>

      <Box display="flex" gap={1} mt={1} alignItems="center">
        <Chip label={audit.source} size="small" />
        <Chip label={audit.dataOrigin} size="small" />
        <Typography variant="caption">
          {new Date(audit.timestamp).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}
