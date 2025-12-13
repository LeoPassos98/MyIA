// frontend/src/features/chat/components/Modals/InspectorModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState } from 'react';
import { 
  Modal, Paper, Typography, Box, IconButton, useTheme, alpha, Tooltip, Fade
} from '@mui/material';
import { 
  DataObject as DataObjectIcon, 
  Close as CloseIcon, 
  ContentCopy as CopyIcon, 
  Check as CheckIcon 
} from '@mui/icons-material';

interface InspectorModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export default function InspectorModal({ open, onClose, data }: InspectorModalProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 2,
        backdropFilter: 'blur(4px)'
      }}
    >
      <Fade in={open}>
        <Paper
          elevation={24}
          sx={{
            width: '100%',
            maxWidth: 900,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            outline: 'none'
          }}
        >
          {/* HEADER */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                p: 0.5, 
                borderRadius: 1, 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                display: 'flex'
              }}>
                <DataObjectIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Inspetor de Objeto
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={copied ? "Copiado!" : "Copiar JSON"}>
                <IconButton onClick={handleCopy} size="small" color={copied ? "success" : "default"}>
                  {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* BODY (Code View) */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 0,
              // CORREÇÃO: Uso de cor do tema em vez de hardcoded #000
              bgcolor: 'action.hover', 
              position: 'relative'
            }}
          >
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 3,
                // CORREÇÃO: Uso da tipografia do tema
                fontFamily: theme.typography.monospace, 
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: 'text.primary',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                
                '&::selection': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2)
                }
              }}
            >
              {jsonString}
            </Box>
          </Box>
          
          {/* FOOTER */}
          <Box sx={{ 
            py: 1, 
            px: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider', 
            bgcolor: 'background.paper',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: theme.typography.monospace }}>
              Tamanho: {jsonString.length} chars
            </Typography>
            
            <Typography variant="caption" color="text.secondary">
              JSON Preview
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
}