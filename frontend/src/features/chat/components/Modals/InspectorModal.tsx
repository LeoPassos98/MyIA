import { useState } from 'react';
import { 
  Modal, 
  Paper, 
  Typography, 
  Box, 
  IconButton, 
  useTheme, 
  alpha, 
  Tooltip,
  Fade
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

  return (
    <Modal
      open={open}
      onClose={onClose}
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
            width: '80vw',
            maxWidth: 900,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          {/* HEADER */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            // Cor de fundo sutil baseada no tema
            bgcolor: alpha(theme.palette.secondary.main, 0.05)
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DataObjectIcon color="secondary" />
              <Typography variant="h6" fontWeight="bold">
                Inspetor de Objeto (JSON)
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={copied ? "Copiado!" : "Copiar JSON"}>
                <IconButton onClick={handleCopy} size="small" color={copied ? "success" : "default"}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* BODY */}
          <Box
            sx={{
              p: 0,
              flex: 1,
              overflow: 'auto',
              bgcolor: theme.palette.mode === 'dark' ? '#0d1117' : '#f6f8fa', // Cores estilo GitHub
            }}
          >
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 3,
                fontFamily: '"Fira Code", "Consolas", monospace',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                // Lógica de cores para o código
                color: theme.palette.mode === 'dark' 
                  ? '#e6edf3' // Texto claro no escuro
                  : '#1f2328', // Texto escuro no claro
                
                // Seleção de texto bonita
                '&::selection': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.3)
                }
              }}
            >
              {JSON.stringify(data, null, 2)}
            </Box>
          </Box>
          
          {/* FOOTER (Opcional - Info rápida) */}
          <Box sx={{ 
            p: 1, 
            px: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider', 
            bgcolor: 'background.paper',
            display: 'flex', 
            justifyContent: 'flex-end'
          }}>
            <Typography variant="caption" color="text.secondary">
              Tamanho do Payload: {JSON.stringify(data).length} caracteres
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
}