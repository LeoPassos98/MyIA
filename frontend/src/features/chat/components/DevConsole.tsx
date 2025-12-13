// frontend/src/features/chat/components/DevConsole.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography, Paper, Fade, alpha } from '@mui/material';
import { Terminal as TerminalIcon } from '@mui/icons-material';

interface DevConsoleProps {
  logs: string[];
  visible: boolean;
}

export function DevConsole({ logs, visible }: DevConsoleProps) {
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
          bgcolor: '#0d1117', // Fundo terminal hacker (Hardcoded propositalmente para estilo)
          border: '1px solid',
          borderColor: alpha('#00FF41', 0.2),
          boxShadow: `0 8px 32px ${alpha('#000', 0.5)}`,
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
          borderBottom: '1px solid', borderColor: alpha('#00FF41', 0.2),
          bgcolor: alpha('#00FF41', 0.05),
        }}>
          <TerminalIcon sx={{ fontSize: 18, color: '#00FF41' }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#00FF41', fontWeight: 600 }}>
            DEBUG CONSOLE
          </Typography>
          <Typography variant="caption" sx={{ ml: 'auto', fontFamily: 'monospace', color: alpha('#00FF41', 0.6), fontSize: '0.7rem' }}>
            {logs.length} logs
          </Typography>
        </Box>

        {/* Logs */}
        <Box sx={{
          flex: 1, overflowY: 'auto', p: 1.5, fontFamily: 'monospace', fontSize: '0.75rem',
          lineHeight: 1.8, color: '#00FF41',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { background: alpha('#00FF41', 0.3), borderRadius: '3px' }
        }}>
          {logs.length === 0 ? (
            <Typography sx={{ color: alpha('#00FF41', 0.4), fontStyle: 'italic', fontSize: 'inherit' }}>
              [SYSTEM] Aguardando eventos...
            </Typography>
          ) : (
            logs.map((log, index) => (
              <Fade in timeout={200} key={index}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography component="span" sx={{ color: alpha('#00FF41', 0.5), fontSize: '0.7rem', minWidth: 65 }}>
                    [{new Date().toLocaleTimeString('pt-BR')}]
                  </Typography>
                  <Typography component="span" sx={{ color: '#00FF41', wordBreak: 'break-all', fontSize: 'inherit' }}>
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