// frontend/src/features/audit/components/InspectorModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useMemo, useEffect } from 'react';
import { 
  Modal, Paper, Typography, Box, IconButton, useTheme, alpha, Tooltip, Fade, Chip
} from '@mui/material';
import { 
  DataObject as DataObjectIcon, 
  Close as CloseIcon, 
  ContentCopy as CopyIcon, 
  Check as CheckIcon,
  Psychology as BrainIcon, // Para o Contexto
  Settings as SettingsIcon
} from '@mui/icons-material';

interface InspectorModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export default function InspectorModal({ open, onClose, data }: InspectorModalProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  
  // Estado para controlar a visualização: 'message' (original) ou 'context' (payload enviado)
  const [viewMode, setViewMode] = useState<'message' | 'context'>('message');

  // Reseta para 'message' sempre que o modal abre ou os dados mudam
  useEffect(() => {
    if (open) setViewMode('message');
  }, [open, data]);

  // 1. Lógica para extrair o sentContext (Auditoria)
  const { auditPayload, auditConfig } = useMemo(() => {
    if (!data?.sentContext) return { auditPayload: null, auditConfig: null };
    try {
      // O sentContext vem do banco como string JSON, precisamos parsear
      const parsed = typeof data.sentContext === 'string' 
        ? JSON.parse(data.sentContext) 
        : data.sentContext;
      
      return {
        auditPayload: parsed.payloadSent_V23 || null,
        auditConfig: parsed.config_V47 || null
      };
    } catch (e) {
      console.error("Erro ao parsear auditoria:", e);
      return { auditPayload: null, auditConfig: null };
    }
  }, [data]);

  if (!data) return null;

  // Decide qual JSON mostrar na tela
  const jsonToShow = viewMode === 'context' && auditPayload ? auditPayload : data;
  const jsonString = JSON.stringify(jsonToShow, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                <SettingsIcon fontSize="small" />
              </Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Inspetor de Mensagem
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

          {/* TOOLBAR (Novos Botões "Mini Card") */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Botão 1: Resposta (Original) */}
            <Box 
              onClick={() => setViewMode('message')}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, borderRadius: 1.5, cursor: 'pointer', transition: 'all 0.2s',
                border: '1px solid',
                borderColor: viewMode === 'message' ? 'primary.main' : 'divider',
                bgcolor: viewMode === 'message' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: viewMode === 'message' ? 'primary.main' : 'text.secondary',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
              }}
            >
              <DataObjectIcon fontSize="small" />
              <Typography variant="caption" fontWeight="bold">Resposta JSON</Typography>
            </Box>

            {/* Botão 2: Contexto Enviado (Auditoria) */}
            <Tooltip title={auditPayload ? "Ver histórico exato enviado para a IA" : "Auditoria indisponível"}>
              <Box 
                onClick={() => auditPayload && setViewMode('context')}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, borderRadius: 1.5, cursor: auditPayload ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                  border: '1px solid',
                  borderColor: viewMode === 'context' ? 'secondary.main' : 'divider',
                  bgcolor: viewMode === 'context' ? alpha(theme.palette.secondary.main, 0.1) : 'transparent',
                  color: viewMode === 'context' ? 'secondary.main' : (auditPayload ? 'text.secondary' : 'text.disabled'),
                  opacity: auditPayload ? 1 : 0.6,
                  '&:hover': { bgcolor: auditPayload ? alpha(theme.palette.secondary.main, 0.05) : 'transparent' }
                }}
              >
                <BrainIcon fontSize="small" />
                <Typography variant="caption" fontWeight="bold">Contexto Enviado</Typography>
              </Box>
            </Tooltip>

            {/* Informações Extras (Config) */}
            {viewMode === 'context' && auditConfig && (
              <Fade in>
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                  <Chip size="small" label={`Strategy: ${auditConfig.strategy}`} variant="outlined" sx={{ height: 24, fontSize: '0.7rem' }} />
                  <Chip size="small" label={`Temp: ${auditConfig.params?.temperature}`} variant="outlined" sx={{ height: 24, fontSize: '0.7rem' }} />
                </Box>
              </Fade>
            )}
          </Box>

          {/* BODY (Code View) */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 0,
              bgcolor: 'action.hover', 
              position: 'relative'
            }}
          >
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 3,
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
            
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              {viewMode === 'message' ? 'VIEW: DATABASE RECORD' : 'VIEW: LLM PAYLOAD (V23)'}
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
}