/**
 * frontend/src/features/settings/components/ModelsManagement/components/CertificationProgress.tsx
 * Alert component for certification progress feedback
 * Standards: docs/STANDARDS.md §3.0, §15
 */

import { Alert, AlertTitle } from '@mui/material';

interface CertificationProgressProps {
  isCertifying: boolean;
  isCertifyingBatch: boolean;
}

/**
 * Exibe feedback visual durante processo de certificação
 */
export function CertificationProgress({
  isCertifying,
  isCertifyingBatch,
}: CertificationProgressProps) {
  if (!isCertifying && !isCertifyingBatch) {
    return null;
  }

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <AlertTitle>Certificação em Andamento</AlertTitle>
      Testando modelo(s)... Isso pode levar até 60 segundos por modelo.
      <br />
      <strong>Você pode sair desta página.</strong> A certificação continuará em segundo
      plano.
    </Alert>
  );
}
