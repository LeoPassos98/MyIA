// frontend/src/features/auditViewer/AuditViewerModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Dialog, DialogContent } from '@mui/material';
import { AuditRecord } from '@/services/auditService';

import { AuditHeader } from './AuditHeader';
import { AuditSummary } from './AuditSummary';
import { AuditResponse } from './AuditResponse';
import { AuditInference } from './AuditInference';
import { AuditUsage } from './AuditUsage';
import { AuditTrace } from './AuditTrace';
import { AuditActions } from './AuditActions';

interface Props {
  open: boolean;
  audit: AuditRecord;
  onClose: () => void;
}

export function AuditViewerModal({ open, audit, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <AuditHeader audit={audit} />

      <DialogContent dividers>
        <AuditSummary audit={audit} />
        <AuditResponse audit={audit} />
        <AuditInference audit={audit} />
        <AuditUsage audit={audit} />
        <AuditTrace audit={audit} />
      </DialogContent>

      <AuditActions audit={audit} onClose={onClose} />
    </Dialog>
  );
}
