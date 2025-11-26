import { useMemo } from 'react';
import {
  Modal, Paper, Typography, Box, Chip, Grid,
  IconButton, Stack, useTheme, alpha
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
  data: any; 
}

// Interface para garantir que o TypeScript saiba o formato dos metadados
interface MessageMeta {
  tokensIn: number;
  tokensOut: number;
  model: string;
  cost: number;
}

export default function PromptModal({ open, onClose, data }: PromptModalProps) {
  const theme = useTheme();

  // Lógica de Parsing Robusta
  const { parsedContext, messageMeta } = useMemo(() => {
    // Valores padrão para evitar erro de "propriedade não existe"
    const defaultMeta: MessageMeta = { tokensIn: 0, tokensOut: 0, model: 'N/A', cost: 0 };

    if (!data) return { parsedContext: null, messageMeta: defaultMeta };

    let rawContext = data;
    
    // Tenta extrair dados do objeto data, com fallback para 0 ou N/A
    const meta: MessageMeta = { 
      tokensIn: data.tokensIn || 0, 
      tokensOut: data.tokensOut || 0, 
      model: data.model || 'N/A', 
      cost: data.costInUSD || 0 
    };

    if (data.sentContext) {
      rawContext = data.sentContext;
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

  if (!open || !data) return null;

  const payload = parsedContext?.payloadSent_V23 || [];
  const config = parsedContext?.config_V47 || {};
  const isManual = config.mode === 'manual' || data.manualContext;

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 2,
        backdropFilter: 'blur(5px)' // Efeito de vidro no fundo do modal
      }}
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
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {/* HEADER */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          // Cabeçalho com cor dinâmica sutil
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon color="primary" />
            <Typography variant="h6" fontWeight="bold" color="text.primary">Auditoria de Contexto</Typography>
            <Chip
              label={isManual ? "MODO MANUAL" : "MODO AUTOMÁTICO"}
              color={isManual ? "warning" : "success"}
              size="small"
              sx={{ fontWeight: 'bold', ml: 2, height: 24 }}
            />
          </Box>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        {/* BODY - SPLIT VIEW */}
        <Grid container sx={{ flex: 1, overflow: 'hidden' }}>

          {/* LADO ESQUERDO: METADADOS & CONFIGURAÇÃO */}
          <Grid item xs={12} md={4} sx={{ 
            borderRight: 1, 
            borderColor: 'divider', 
            bgcolor: 'background.default', // Cor de fundo padrão do tema
            overflowY: 'auto', 
            p: 3 
          }}>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              <SettingsIcon fontSize="small" /> CONFIGURAÇÃO DA INFERÊNCIA
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Modelo:</Typography>
                  <Typography variant="body2" fontWeight="bold">{messageMeta.model}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Temperatura:</Typography>
                  <Typography variant="body2">{config.temperature ?? 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Estratégia:</Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{config.strategy || 'Padrão'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Janela de Memória:</Typography>
                  <Typography variant="body2">{config.memoryWindow ?? config.selectedMessages ?? 'N/A'}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              <CostIcon fontSize="small" /> CONSUMO & TOKENS
            </Typography>

            <Paper variant="outlined" sx={{ 
              p: 2, mb: 3, 
              borderRadius: 2, 
              bgcolor: alpha(theme.palette.success.main, 0.05),
              borderColor: alpha(theme.palette.success.main, 0.2)
            }}>
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
                  <Typography variant="body1" fontWeight="bold" sx={{ color: 'success.main' }}>
                    ${messageMeta.cost?.toFixed(6) || '0.000000'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {isManual && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2, border: '1px dashed', borderColor: theme.palette.warning.main }}>
                <Typography variant="subtitle2" color="warning.main" fontWeight="bold" gutterBottom>
                  ⚠️ Injeção Manual
                </Typography>
                <Typography variant="caption" display="block" color="text.primary">
                  O usuário selecionou mensagens específicas manualmente. O algoritmo RAG automático foi ignorado nesta requisição.
                </Typography>
              </Box>
            )}
          </Grid>

          {/* LADO DIREITO: PAYLOAD REAL (Adaptável Dark/Light) */}
          <Grid item xs={12} md={8} sx={{ 
            height: '100%', 
            overflowY: 'auto', 
            p: 3, 
            // Fundo dinâmico: Escuro "profundo" no Dark Mode, Cinza bem claro no Light Mode
            bgcolor: theme.palette.mode === 'dark' ? alpha('#000', 0.3) : '#f8f9fa',
            color: 'text.primary'
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <BrainIcon fontSize="small" /> FLUXO DE CONTEXTO (PAYLOAD JSON)
            </Typography>
            <Typography variant="caption" sx={{ mb: 3, display: 'block', color: 'text.secondary' }}>
              Esta é a lista exata de mensagens enviada para a API do Modelo. O que está aqui é o que a IA "leu".
            </Typography>

            {!payload || payload.length === 0 ? (
              <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, color: 'text.disabled', textAlign: 'center' }}>
                Dados de payload não disponíveis ou formato desconhecido.
                <br/>
                <Typography variant="caption" fontFamily="monospace">
                  {JSON.stringify(parsedContext, null, 2)}
                </Typography>
              </Box>
            ) : (
              payload.map((msg: any, index: number) => {
                
                // CORES DINÂMICAS BASEADAS NOS ROLES
                let roleColor = theme.palette.text.secondary;
                let bgColor = alpha(theme.palette.text.primary, 0.03);
                let borderColor = theme.palette.divider;

                if (msg.role === 'system') {
                  roleColor = theme.palette.warning.main;
                  bgColor = alpha(theme.palette.warning.main, 0.05);
                  borderColor = theme.palette.warning.main;
                } else if (msg.role === 'user') {
                  roleColor = theme.palette.info.main;
                  bgColor = alpha(theme.palette.info.main, 0.05);
                  borderColor = theme.palette.info.main;
                } else if (msg.role === 'assistant') {
                  roleColor = theme.palette.success.main;
                  bgColor = alpha(theme.palette.success.main, 0.05);
                  borderColor = theme.palette.success.main;
                }

                const title = msg.role === 'system' && isManual && index === 0 
                  ? "SYSTEM PROMPT / CONTEXTO MANUAL" 
                  : msg.role.toUpperCase();

                return (
                  <Box key={index} sx={{ 
                    mb: 3, 
                    borderLeft: 4, 
                    borderColor: borderColor, 
                    pl: 2, 
                    py: 1, 
                    bgcolor: bgColor, 
                    borderRadius: 1 
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: roleColor, letterSpacing: 1 }}>
                      {title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        whiteSpace: 'pre-wrap',
                        fontFamily: '"Fira Code", monospace',
                        // Garante contraste correto em Light e Dark mode
                        color: theme.palette.text.primary,
                        fontSize: '0.85rem',
                        lineHeight: 1.6
                      }}
                    >
                      {msg.content}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  );
}