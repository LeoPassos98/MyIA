// frontend/src/features/chat/components/DevConsole.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography, Paper, Fade, alpha, useTheme } from '@mui/material';
import { Terminal as TerminalIcon } from '@mui/icons-material';

interface DevConsoleProps {
  logs: string[];
  visible: boolean;
}

export function DevConsole({ logs, visible }: DevConsoleProps) {
  const theme = useTheme();
  if (!visible) return null;

  return (
    <Fade in timeout={400}>
      <Paper
        elevation={8}
        sx={{
          mx: 2,
          mb: 1,
          height: 200,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: theme.palette.custom.hackerBg, // Fundo terminal hacker (padronizado)
          border: '1px solid',
          borderColor: alpha(theme.palette.custom.matrix, 0.2),
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.5)}`,
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
          borderBottom: '1px solid', borderColor: alpha(theme.palette.custom.matrix, 0.2),
          bgcolor: alpha(theme.palette.custom.matrix, 0.05),
        }}>
          <TerminalIcon sx={{ fontSize: 18, color: theme.palette.custom.matrix }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: theme.palette.custom.matrix, fontWeight: 600 }}>
            DEBUG CONSOLE
          </Typography>
          <Typography variant="caption" sx={{ ml: 'auto', fontFamily: 'monospace', color: alpha(theme.palette.custom.matrix, 0.6), fontSize: '0.7rem' }}>
            {logs.length} logs
          </Typography>
        </Box>

        {/* Logs */}
        <Box sx={{
          flex: 1, overflowY: 'auto', p: 1.5, fontFamily: 'monospace', fontSize: '0.75rem',
          lineHeight: 1.8, color: theme.palette.custom.matrix,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { background: alpha(theme.palette.custom.matrix, 0.3), borderRadius: 1.5 }
        }}>
          {logs.length === 0 ? (
            <Typography sx={{ color: alpha(theme.palette.custom.matrix, 0.4), fontStyle: 'italic', fontSize: 'inherit' }}>
              [SYSTEM] Aguardando eventos...
            </Typography>
          ) : (
            logs.map((log, index) => (
              <Fade in timeout={200} key={index}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography component="span" sx={{ color: alpha(theme.palette.custom.matrix, 0.5), fontSize: '0.7rem', minWidth: 65 }}>
                    [{new Date().toLocaleTimeString('pt-BR')}]
                  </Typography>
                  <Typography component="span" sx={{ color: theme.palette.custom.matrix, wordBreak: 'break-all', fontSize: 'inherit' }}>
                    {log}
                  </Typography>
                </Box>
              </Fade>
            ))
          )}
        </Box>
      </Paper>
    </Fade>
  );
}