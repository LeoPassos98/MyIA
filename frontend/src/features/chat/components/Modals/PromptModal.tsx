import { useMemo } from 'react';
import {
  Modal, Paper, Typography, Box, Chip, Grid,
  IconButton, Stack
} from '@mui/material';
import {
  Code as CodeIcon,
  Close as CloseIcon,
  Psychology as BrainIcon,
  Settings as SettingsIcon,
  AttachMoney as CostIcon
} from '@mui/icons-material';

interface PromptModalProps {
  open: boolean;
  onClose: () => void;
  data: any; // Pode ser a string JSON do sentContext ou o objeto Message completo
}

export const PromptModal = ({ open, onClose, data }: PromptModalProps) => {
  if (!data) return null;

  // Lógica de Parsing Robusta
  const { parsedContext, messageMeta } = useMemo(() => {
    let rawContext = data;
    let meta = { tokensIn: 0, tokensOut: 0, model: 'N/A', cost: 0 };

    if (data.sentContext) {
      rawContext = data.sentContext;
      meta = {
        tokensIn: data.tokensIn || 0,
        tokensOut: data.tokensOut || 0,
        model: data.model || 'N/A',
        cost: data.costInUSD || 0
      };
    }

    try {
      if (typeof rawContext === 'string') {
        const parsed = JSON.parse(rawContext);
        return { parsedContext: parsed, messageMeta: meta };
      }
      return { parsedContext: rawContext, messageMeta: meta };
    } catch (e) {
      console.error("Erro ao parsear contexto:", e);
      return { parsedContext: null, messageMeta: meta };
    }
  }, [data]);

  if (!parsedContext) return null;

  const payload = parsedContext.payloadSent_V23 || [];
  const config = parsedContext.config_V47 || {};
  const isManual = config.mode === 'manual';

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '95vw',
          height: '90vh',
          maxWidth: 1200,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* HEADER */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#1e1e1e' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon color="primary" />
            <Typography variant="h6" color="white">Auditoria de Contexto Enviado</Typography>
            <Chip
              label={isManual ? "MODO MANUAL" : "MODO AUTOMÁTICO"}
              color={isManual ? "warning" : "success"}
              size="small"
              sx={{ fontWeight: 'bold', ml: 2 }}
            />
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>

        {/* BODY - SPLIT VIEW */}
        <Grid container sx={{ flex: 1, overflow: 'hidden' }}>

          {/* LADO ESQUERDO: METADADOS */}
          <Grid item xs={12} md={4} sx={{ borderRight: 1, borderColor: 'divider', bgcolor: 'background.default', overflowY: 'auto', p: 3 }}>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon fontSize="small" /> CONFIGURAÇÃO DA INFERÊNCIA
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Modelo:</Typography>
                  <Typography variant="body2" fontWeight="bold">{messageMeta.model}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Temperatura:</Typography>
                  <Typography variant="body2">{config.temperature ?? 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Estratégia:</Typography>
                  <Typography variant="body2">{config.strategy || 'Manual'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Janela de Memória:</Typography>
                  <Typography variant="body2">{config.memoryWindow ?? config.selectedMessages ?? 'N/A'}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CostIcon fontSize="small" /> CONSUMO & TOKENS
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'rgba(0, 255, 0, 0.03)' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" display="block" color="text.secondary">Tokens Entrada</Typography>
                  <Typography variant="h6" color="primary">{messageMeta.tokensIn}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" display="block" color="text.secondary">Tokens Saída</Typography>
                  <Typography variant="h6" color="secondary">{messageMeta.tokensOut}</Typography>
                </Grid>
                <Grid item xs={12} sx={{ borderTop: 1, borderColor: 'divider', pt: 1, mt: 1 }}>
                  <Typography variant="caption" display="block" color="text.secondary">Custo Estimado</Typography>
                  <Typography variant="body1" fontWeight="bold">${messageMeta.cost?.toFixed(6) || '0.000000'}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {isManual && (
              <Box sx={{ mt: 2 }}>
                <Chip label="Injeção de Contexto Ativa" color="warning" variant="outlined" size="small" />
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  O usuário injetou texto manualmente ou selecionou mensagens específicas, ignorando o algoritmo RAG padrão.
                </Typography>
              </Box>
            )}
          </Grid>

          {/* LADO DIREITO: PAYLOAD REAL */}
          <Grid item xs={12} md={8} sx={{ height: '100%', overflowY: 'auto', p: 3, bgcolor: '#121212' }}>
            <Typography variant="subtitle2" color="#888" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BrainIcon fontSize="small" /> FLUXO DE CONTEXTO (PAYLOAD)
            </Typography>
            <Typography variant="caption" color="#666" sx={{ mb: 3, display: 'block' }}>
              Esta é a lista exata de mensagens enviada para a API do Modelo. O que está aqui é o que a IA "leu".
            </Typography>

            {payload.map((msg: any, index: number) => {
              let borderColor = '#333';
              let title = msg.role.toUpperCase();
              let titleColor = '#888';
              let bgColor = '#1e1e1e';

              if (msg.role === 'system') {
                borderColor = '#ed6c02';
                titleColor = '#ed6c02';
                bgColor = 'rgba(237, 108, 2, 0.05)';
                if (isManual && index === 0) title = "SYSTEM PROMPT / CONTEXTO MANUAL";
              } else if (msg.role === 'user') {
                borderColor = '#1976d2';
                titleColor = '#1976d2';
              } else if (msg.role === 'assistant') {
                borderColor = '#2e7d32';
                titleColor = '#2e7d32';
              }

              return (
                <Box key={index} sx={{ mb: 3, borderLeft: 4, borderColor: borderColor, pl: 2, py: 1, bgcolor: bgColor, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: titleColor, letterSpacing: 1 }}>
                    {title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      color: '#e0e0e0',
                      fontSize: '0.85rem',
                      lineHeight: 1.6
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Box>
              );
            })}
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  );
};
