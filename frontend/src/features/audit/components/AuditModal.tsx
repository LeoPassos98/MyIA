// frontend/src/features/audit/components/AuditModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { auditService, type AuditRecord } from '../../../services/auditService';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<AuditRecord | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAudit() {
      try {
        setLoading(true);
        setError(null);
        const data = await auditService.getAuditByMessageId(messageId);
        
        if (isMounted) {
          setAuditData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar auditoria');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAudit();

    return () => {
      isMounted = false;
    };
  }, [messageId]);

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
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && auditData && (
          <>
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

            {/* JSON Completo (Read-only) */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Registro de Auditoria Completo
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {JSON.stringify(auditData, null, 2)}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
