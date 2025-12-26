// frontend/src/features/auditViewer/AuditActions.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState } from 'react';
import { DialogActions, Button } from '@mui/material';
import { AuditRecord } from '@/services/auditService';
import { RawAuditModal } from './RawAuditModal';

interface Props {
  audit: AuditRecord;
  onClose: () => void;
}

export function AuditActions({ audit, onClose }: Props) {
  const [rawModalOpen, setRawModalOpen] = useState(false);

  return (
    <>
      <DialogActions>
        <Button variant="text" onClick={() => setRawModalOpen(true)}>
          Ver dados técnicos (JSON)
        </Button>

        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>

      <RawAuditModal
        open={rawModalOpen}
        audit={audit}
        onClose={() => setRawModalOpen(false)}
      />
    </>
  );
}
