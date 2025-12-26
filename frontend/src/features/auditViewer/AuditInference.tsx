// frontend/src/features/auditViewer/AuditInference.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography } from '@mui/material';
import { AuditRecord } from '@/services/auditService';

interface Props {
  audit: AuditRecord;
}

export function AuditInference({ audit }: Props) {
  const { inference } = audit;
  const parametersText = inference?.parameters 
    ? JSON.stringify(inference.parameters, null, 2) 
    : null;

  return (
    <Box mb={3}>
      <Typography variant="subtitle2" gutterBottom>
        Configuração da IA
      </Typography>

      <Typography variant="body2">
        Provedor: {inference?.provider ?? '—'}
      </Typography>
      <Typography variant="body2">
        Modelo: {inference?.model ?? '—'}
      </Typography>
      <Typography variant="body2">
        Estratégia: {inference?.strategy ?? '—'}
      </Typography>
      
      {parametersText && (
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            Parâmetros: {parametersText}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
