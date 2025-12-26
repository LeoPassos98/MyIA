// frontend/src/features/auditViewer/AuditSummary.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography } from '@mui/material';
import { AuditRecord } from '@/services/auditService';

interface Props {
  audit: AuditRecord;
}

export function AuditSummary({ audit }: Props) {
  return (
    <Box mb={3}>
      <Typography variant="subtitle2" gutterBottom>
        Resumo
      </Typography>

      <Typography variant="body2">
        A IA respondeu utilizando o modelo <strong>{audit.inference?.provider ?? '—'}</strong> /{' '}
        <strong>{audit.inference?.model ?? '—'}</strong> com status{' '}
        <strong>{audit.execution?.status ?? 'desconhecido'}</strong>.
      </Typography>
    </Box>
  );
}
