// frontend-admin/src/components/Certifications/JobProgressBar.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, LinearProgress, Tooltip, Typography } from '@mui/material';
import { JobStatus } from '../../services/certificationApi';

interface JobProgressBarProps {
  job: JobStatus;
}

export function JobProgressBar({ job }: JobProgressBarProps) {
  // Calcular porcentagem de progresso
  const percentage = job.totalModels > 0 
    ? Math.round((job.processedModels / job.totalModels) * 100) 
    : 0;

  // Determinar cor baseada no status
  const getProgressColor = (): 'inherit' | 'primary' | 'success' | 'error' => {
    switch (job.status) {
      case 'QUEUED':
        return 'inherit';
      case 'PROCESSING':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      default:
        return 'inherit';
    }
  };

  // Calcular tempo decorrido
  const getElapsedTime = (): string => {
    if (!job.startedAt) return 'Não iniciado';
    
    const start = new Date(job.startedAt).getTime();
    const end = job.completedAt 
      ? new Date(job.completedAt).getTime() 
      : Date.now();
    
    const diffMs = end - start;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffHour > 0) {
      return `${diffHour}h ${diffMin % 60}m`;
    } else if (diffMin > 0) {
      return `${diffMin}m ${diffSec % 60}s`;
    } else {
      return `${diffSec}s`;
    }
  };

  // Conteúdo do tooltip com detalhes
  const tooltipContent = (
    <Box>
      <Typography variant="caption" display="block" fontWeight="bold">
        Detalhes do Progresso
      </Typography>
      <Typography variant="caption" display="block">
        Modelos processados: {job.processedModels}/{job.totalModels}
      </Typography>
      <Typography variant="caption" display="block" color="success.main">
        ✓ Sucessos: {job.successCount}
      </Typography>
      <Typography variant="caption" display="block" color="error.main">
        ✗ Falhas: {job.failureCount}
      </Typography>
      <Typography variant="caption" display="block">
        Tempo decorrido: {getElapsedTime()}
      </Typography>
      <Typography variant="caption" display="block">
        Status: {job.status}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box sx={{ width: '100%', minWidth: 120 }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={getProgressColor()}
            sx={{
              flex: 1,
              height: 8,
              borderRadius: 1,
              backgroundColor: 'grey.200',
            }}
          />
          <Typography variant="caption" fontWeight="medium" minWidth={40}>
            {percentage}%
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {job.processedModels}/{job.totalModels} modelos
        </Typography>
      </Box>
    </Tooltip>
  );
}
