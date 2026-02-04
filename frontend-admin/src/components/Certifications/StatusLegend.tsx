// frontend-admin/src/components/Certifications/StatusLegend.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Paper, Typography, Chip } from '@mui/material';
import PendingIcon from '@mui/icons-material/Pending';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Legenda visual explicando os diferentes status de jobs
 * Ajuda o usuário a entender o significado de cada status
 */
export function StatusLegend() {
  const statuses = [
    {
      status: 'QUEUED',
      label: 'Na Fila',
      color: 'warning' as const,
      icon: <PendingIcon fontSize="small" />,
      description: 'Job aguardando para ser processado'
    },
    {
      status: 'PROCESSING',
      label: 'Em Execução',
      color: 'info' as const,
      icon: <PlayArrowIcon fontSize="small" />,
      description: 'Job sendo processado no momento'
    },
    {
      status: 'COMPLETED',
      label: 'Completo',
      color: 'success' as const,
      icon: <CheckCircleIcon fontSize="small" />,
      description: 'Job concluído com sucesso'
    },
    {
      status: 'FAILED',
      label: 'Falhou',
      color: 'error' as const,
      icon: <ErrorIcon fontSize="small" />,
      description: 'Job falhou durante a execução'
    }
  ];

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        backgroundColor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200'
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        📋 Legenda de Status
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
        {statuses.map((item) => (
          <Box 
            key={item.status} 
            display="flex" 
            alignItems="center" 
            gap={1}
            sx={{ minWidth: 200 }}
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              {item.icon}
              <Chip
                label={item.label}
                color={item.color}
                size="small"
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
