// frontend/src/features/auditViewer/AuditUsage.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography } from '@mui/material';
import { AuditRecord } from '@/services/auditService';

interface Props {
  audit: AuditRecord;
}

export function AuditUsage({ audit }: Props) {
  const { usage, execution } = audit;

  return (
    <Box mb={3}>
      <Typography variant="subtitle2" gutterBottom>
        Uso e Custos
      </Typography>

      <Typography variant="body2">
        Tokens entrada: {usage?.tokensIn ?? 0}
      </Typography>
      <Typography variant="body2">
        Tokens saída: {usage?.tokensOut ?? 0}
      </Typography>
      <Typography variant="body2">
        Total: {usage?.totalTokens ?? 0}
      </Typography>
      <Typography variant="body2">
        Custo: ${usage?.costInUSD?.toFixed(6) ?? '0.000000'}
      </Typography>
      
      {execution?.latencyMs && (
        <Typography variant="body2">
          Latência: {execution.latencyMs}ms
        </Typography>
      )}
    </Box>
  );
}
