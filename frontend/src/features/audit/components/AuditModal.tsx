// frontend/src/features/audit/components/AuditModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { AuditIntent, AuditMode } from '../types';

interface AuditModalProps {
  audit: AuditIntent;
  onClose: () => void;
}

const MODE_LABEL: Record<AuditMode, string> = {
  payload: 'Payload Enviado',
  response: 'Resposta do Modelo',
  context: 'Contexto da Conversa',
};

export function AuditModal({ audit, onClose }: AuditModalProps) {
  const { messageId, mode, source } = audit;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6">Auditoria da Mensagem</Typography>
          <Typography variant="body2" color="text.secondary">
            {MODE_LABEL[mode]}
          </Typography>
        </Box>

        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Conteúdo */}
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Identidade
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 1.5,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Message ID
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              {messageId}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Origem
            </Typography>
            <Chip label={source} size="small" variant="outlined" />

            <Typography variant="body2" color="text.secondary">
              Modo
            </Typography>
            <Chip label={mode} size="small" color="primary" variant="outlined" />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Chip
            label="⚠️ Dados simulados — backend ainda não conectado"
            color="warning"
            size="small"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
