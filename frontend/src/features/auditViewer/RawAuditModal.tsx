// frontend/src/features/auditViewer/RawAuditModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Dialog, DialogContent, DialogTitle, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AuditRecord } from '@/services/auditService';

interface Props {
  open: boolean;
  audit: AuditRecord;
  onClose: () => void;
}

export function RawAuditModal({ open, audit, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Dados Técnicos (JSON)
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box
          component="pre"
          sx={{
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            backgroundColor: (theme) => theme.palette.background.default,
            p: 2,
            borderRadius: 1,
          }}
        >
          {JSON.stringify(audit, null, 2)}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
