// frontend/src/features/audit/components/PromptModal.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useMemo } from 'react';
import {
  Modal, Paper, Typography, Box, Chip, Grid,
  IconButton, Stack, useTheme, alpha
} from '@mui/material';
import {
  Code as CodeIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  AttachMoney as CostIcon,
  DataObject as RawDataIcon,
  Psychology as BrainIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface PromptModalProps {
  open: boolean;
  onClose: () => void;
  data: any; 
}

interface MessageMeta {
  tokensIn: number;
  tokensOut: number;
  model: string;
  cost: number;
}

export default function PromptModal({ open, onClose, data }: PromptModalProps) {
  const theme = useTheme();

  const { parsedContext, messageMeta, payload, hasContext } = useMemo(() => {
    const defaultMeta: MessageMeta = { tokensIn: 0, tokensOut: 0, model: 'N/A', cost: 0 };

    if (!data) return { parsedContext: null, messageMeta: defaultMeta, payload: [], hasContext: false };

    const meta: MessageMeta = { 
      tokensIn: data.tokensIn || 0, 
      tokensOut: data.tokensOut || 0, 
      model: data.model || 'N/A', 
      cost: data.costInUSD || 0 
    };

    let rawContext = data.sentContext;
    let contextObj = null;
    let hasCtx = false;

    if (rawContext) {
      if (typeof rawContext === 'string' && (rawContext === 'auto' || rawContext === 'manual')) {
        contextObj = { config_V47: { mode: rawContext }, isLegacySimple: true };
        hasCtx = true;
      } else {
        try {
          contextObj = typeof rawContext === 'string' ? JSON.parse(rawContext) : rawContext;
          hasCtx = true;
        } catch (e) {
          contextObj = { rawString: String(rawContext), error: "Falha no parse" };
        }
      }
    }

    let foundPayload = [];
    if (contextObj) {
      foundPayload = contextObj.payloadSent_V23 || contextObj.payload || contextObj.messages || contextObj.payloadSent || []; 
    }

    return { parsedContext: contextObj, messageMeta: meta, payload: foundPayload, hasContext: hasCtx };
  }, [data]);

  if (!open || !data) return null;

  const config = parsedContext?.config_V47 || {};
  const params = config.params || {}; 
  const isLegacy = parsedContext?.isLegacySimple;
  const isManual = config.mode === 'manual' || data.manualContext;
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, backdropFilter: 'blur(5px)' }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '95vw', height: '90vh', maxWidth: 1200, display: 'flex', flexDirection: 'column',
          bgcolor: 'background.paper', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider'
        }}
      >
        {/* HEADER */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon color="primary" />
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              {hasContext ? "Auditoria de Contexto" : "Detalhes da Mensagem"}
            </Typography>
            {hasContext && (
              <Chip
                label={isLegacy ? "LEGADO" : (isManual ? "MANUAL" : "AUTOMÁTICO")}
                color={isLegacy ? "default" : (isManual ? "warning" : "success")}
                size="small"
                sx={{ fontWeight: 'bold', ml: 2 }}
              />
            )}
          </Box>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        {/* BODY */}
        <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
          
          {/* ESQUERDA: METADADOS */}
          <Grid item xs={12} md={4} sx={{ borderRight: 1, borderColor: 'divider', bgcolor: 'background.default', overflowY: 'auto', p: 3 }}>
            
            {/* BLOCO 1: PARAMETROS LLM */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              <SettingsIcon fontSize="small" /> CONFIGURAÇÃO DA INFERÊNCIA
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Modelo:</Typography>
                  <Typography variant="body2" fontWeight="bold">{messageMeta.model}</Typography>
                </Box>
                {hasContext && !isLegacy && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Temperatura:</Typography>
                      <Typography variant="body2" fontWeight="500">{params.temperature ?? 'Padrão'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Top-K / P:</Typography>
                      <Typography variant="body2">{params.topK ?? params.topP ?? 'Padrão'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Janela (Memória):</Typography>
                      <Typography variant="body2">{params.memoryWindow ? `${params.memoryWindow} msgs` : 'Automático'}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </Paper>

            {/* BLOCO 2: CUSTOS */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              <CostIcon fontSize="small" /> CONSUMO
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderColor: alpha(theme.palette.success.main, 0.2) }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" display="block" color="text.secondary">Entrada</Typography>
                  <Typography variant="h6" color="primary">{messageMeta.tokensIn}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" display="block" color="text.secondary">Saída</Typography>
                  <Typography variant="h6" color="secondary">{messageMeta.tokensOut}</Typography>
                </Grid>
                <Grid item xs={12} sx={{ borderTop: 1, borderColor: 'divider', pt: 1, mt: 1 }}>
                  <Typography variant="caption" display="block" color="text.secondary">Custo Total</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: 'success.main' }}>${messageMeta.cost?.toFixed(6) || '0.000000'}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* BLOCO 3: INFO EXTRA */}
            {hasContext && !isLegacy && (
              <Box sx={{ mt: 2 }}>
                 <Typography variant="caption" color="text.disabled" display="block" gutterBottom>
                   Timestamp: {new Date(config.timestamp || Date.now()).toLocaleString()}
                 </Typography>
                 <Typography variant="caption" color="text.disabled" display="block">
                   Estratégia: {config.strategy?.toUpperCase() || 'STANDARD'}
                 </Typography>
              </Box>
            )}
          </Grid>

          {/* DIREITA: CONTEXTO */}
          <Grid item xs={12} md={8} sx={{ height: '100%', overflowY: 'auto', p: 3, bgcolor: 'action.hover', color: 'text.primary' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              {hasContext ? <BrainIcon fontSize="small" /> : <InfoIcon fontSize="small" />} 
              {hasContext ? " PAYLOAD ENVIADO (MENSAGENS)" : " INFORMAÇÃO"}
            </Typography>

            {hasContext ? (
              payload && payload.length > 0 ? (
                payload.map((msg: any, index: number) => {
                  let roleColor = theme.palette.text.secondary;
                  let bgColor = alpha(theme.palette.text.primary, 0.03);
                  let borderColor = theme.palette.divider;

                  if (msg.role === 'system') { roleColor = theme.palette.warning.main; bgColor = alpha(theme.palette.warning.main, 0.05); borderColor = theme.palette.warning.main; } 
                  else if (msg.role === 'user') { roleColor = theme.palette.info.main; bgColor = alpha(theme.palette.info.main, 0.05); borderColor = theme.palette.info.main; } 
                  else if (msg.role === 'assistant') { roleColor = theme.palette.success.main; bgColor = alpha(theme.palette.success.main, 0.05); borderColor = theme.palette.success.main; }

                  return (
                    <Box key={index} sx={{ mb: 3, borderLeft: 4, borderColor: borderColor, pl: 2, py: 1, bgcolor: bgColor, borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: roleColor, letterSpacing: 1 }}>{msg.role?.toUpperCase() || 'UNKNOWN'}</Typography>
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', fontFamily: theme.typography.monospace, fontSize: '0.85rem' }}>{msg.content}</Typography>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">Detalhes do payload não disponíveis.</Typography>
                </Box>
              )
            ) : (
              <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', opacity: 0.6 }}>
                <RawDataIcon sx={{ fontSize: 40, mb: 2, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>Sem Auditoria</Typography>
                <Typography variant="body2" color="text.secondary">Dados de contexto não encontrados para esta mensagem.</Typography>
                <Box component="pre" sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.7rem', maxWidth: '100%', overflow: 'auto' }}>
                  {JSON.stringify(data, null, 2)}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  );
}