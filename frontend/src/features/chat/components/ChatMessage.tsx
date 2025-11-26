import { Box, Paper, Typography, IconButton, Chip, Fade, alpha, useTheme } from '@mui/material';
import { 
  Code as CodeIcon, 
  DataObject as DataObjectIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer'; // Novo import

interface ChatMessageProps {
  message: Message;
  isDevMode: boolean;
  onViewPrompt?: (data: any) => void;
  onViewInspector?: (data: any) => void;
}

export default function ChatMessage({ message, isDevMode, onViewPrompt, onViewInspector }: ChatMessageProps) {
  const theme = useTheme(); // Hook para acessar o Design System
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Se for mensagem de sistema e não estiver em modo dev, não mostra (opcional)
  if (isSystem && !isDevMode) return null;

  return (
    <Fade in timeout={400}>
      <Box 
        sx={{ 
          mb: 2,
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          px: { xs: 1, sm: 2 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            gap: 1.5,
            maxWidth: { xs: '90%', sm: '75%', md: '70%' },
            alignItems: 'flex-start'
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              mt: 0.5,
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isUser 
                ? alpha(theme.palette.primary.main, 0.1) 
                : alpha(theme.palette.secondary.main, 0.1),
              color: isUser ? 'primary.main' : 'secondary.main',
              flexShrink: 0
            }}
          >
            {isUser ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
          </Box>

          {/* Balão da Mensagem */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              borderTopRightRadius: isUser ? 0 : 2,
              borderTopLeftRadius: isUser ? 2 : 0,
              bgcolor: isUser 
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08) 
                : 'background.paper',
              border: '1px solid',
              borderColor: isUser 
                ? alpha(theme.palette.primary.main, 0.2) 
                : 'divider',
              '& p': { m: 0 },
              '& pre': { m: 0 }
            }}
          >
            {message.role === 'user' ? (
              <Typography 
                variant="body1" 
                sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', lineHeight: 1.6 }}
              >
                {message.content}
              </Typography>
            ) : (
              <Box sx={{ color: 'text.primary' }}>
                <MarkdownRenderer content={message.content} />
              </Box>
            )}

            {/* Rodapé da Mensagem (Timestamp e Ícones) */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>

              {/* Botões de Ação */}
              <Box sx={{ display: 'flex', gap: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }}>
                {/* Botão Copiar (Sempre visível) */}
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(message.content)} title="Copiar">
                  <CopyIcon fontSize="inherit" />
                </IconButton>
                
                {/* CORREÇÃO AQUI: Botões de Debug só aparecem se isDevMode for true */}
                {isDevMode && message.role === 'assistant' && (
                  <>
                    <IconButton 
                      size="small" 
                      onClick={() => onViewPrompt && onViewPrompt(message)} 
                      title="Ver Prompt Enviado"
                    >
                      <CodeIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => onViewInspector && onViewInspector(message)} 
                      title="Inspecionar JSON"
                    >
                      <DataObjectIcon fontSize="inherit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>

            {/* Dados de Debug (Visível apenas se isDevMode e se houver dados) */}
            {isDevMode && message.model && (
               <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                 <Chip label={message.model} size="small" variant="outlined" sx={{ mr: 1, fontSize: '0.65rem' }} />
                 <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {(message.costInUSD || 0).toFixed(6)} USD
                 </Typography>
               </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Fade>
  );
}