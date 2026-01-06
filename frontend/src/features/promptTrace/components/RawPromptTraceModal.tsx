// frontend/src/features/promptTrace/components/RawPromptTraceModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Box,
  Button,
  Divider,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { PromptTraceRecord } from '../types';

interface Props {
  open: boolean;
  trace: PromptTraceRecord;
  onClose: () => void;
}

/**
 * Modal para exibir JSON do trace
 * 
 * Standards §7: rawPayload removido (Anti-Duplicação)
 * O trace formatado contém todos os dados necessários para debug
 */
export function RawPromptTraceModal({ open, trace, onClose }: Props) {
  const jsonString = useMemo(() => JSON.stringify(trace, null, 2), [trace]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Dados Técnicos (JSON)
        <IconButton onClick={onClose} size="small" aria-label="Fechar modal">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Dados completos do trace formatados para análise
        </Typography>
      </Box>

      <DialogContent>
        <Box
          component="pre"
          sx={{
            overflow: 'auto',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            bgcolor: 'background.default',
            p: 2,
            borderRadius: 1,
            maxHeight: 520,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {jsonString}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button startIcon={<ContentCopyIcon />} onClick={handleCopy}>
          Copiar JSON
        </Button>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
