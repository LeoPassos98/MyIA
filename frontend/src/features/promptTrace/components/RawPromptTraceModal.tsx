// frontend/src/features/promptTrace/components/RawPromptTraceModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Box,
  Button,
  Tabs,
  Tab,
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

type TabKey = 'provider' | 'ui';

function a11yProps(index: number) {
  return {
    id: `raw-json-tab-${index}`,
    'aria-controls': `raw-json-tabpanel-${index}`,
  };
}

/**
 * Modal para exibir JSON bruto do trace
 *
 * ✅ Tab 1: payload original do backend (fiel ao que foi salvo/enviado)
 * ✅ Tab 2: record normalizado usado pela UI
 */
export function RawPromptTraceModal({ open, trace, onClose }: Props) {
  const [tab, setTab] = useState<TabKey>('provider');

  const providerJsonString = useMemo(() => {
    const payload = trace.rawPayload ?? {
      warning:
        'rawPayload ausente. Atualize o mapper para salvar rawPayload: raw.',
    };
    return JSON.stringify(payload, null, 2);
  }, [trace.rawPayload]);

  const uiJsonString = useMemo(() => JSON.stringify(trace, null, 2), [trace]);

  const activeJsonString = tab === 'provider' ? providerJsonString : uiJsonString;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeJsonString);
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

      <Box sx={{ px: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          aria-label="Raw JSON tabs"
        >
          <Tab
            label="Provider payload"
            value="provider"
            {...a11yProps(0)}
          />
          <Tab label="UI record" value="ui" {...a11yProps(1)} />
        </Tabs>

        <Typography variant="caption" color="text.secondary">
          {tab === 'provider'
            ? 'Payload bruto retornado pelo backend (fonte técnica / fiel).'
            : 'Estrutura normalizada usada pela UI.'}
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
          {activeJsonString}
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
