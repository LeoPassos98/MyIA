// frontend-admin/src/components/Certifications/StatsOverview.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Grid, CircularProgress, Typography } from '@mui/material';
import { useStats } from '../../hooks/useStats';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { StatCard } from './StatCard';
import { logger } from '../../utils/logger';

export function StatsOverview() {
  const { stats, loading, error } = useStats(10000); // Refresh a cada 10s

  // Debug removido em produção - usar logger se necessário
  logger.debug('StatsOverview render', { hasStats: !!stats, loading, hasError: !!error });

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // FIX: O backend retorna stats.queue.queue, não stats.queue diretamente
  const queueData: any = stats?.queue;
  const queueStats = queueData?.queue || {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0
  };

  // Configuração dos cards de estatísticas
  const statsConfig = [
    {
      icon: <PendingIcon sx={{ color: 'warning.main', fontSize: 32 }} />,
      value: queueStats.waiting,
      label: 'Na Fila',
      emoji: '⏳',
      color: 'warning' as const,
      tooltip: 'Jobs aguardando na fila para serem processados. Serão executados assim que houver capacidade disponível.',
      helpTitle: 'Na Fila',
      helpDescription: 'Jobs aguardando para serem processados. Eles serão executados automaticamente quando houver capacidade disponível no sistema.'
    },
    {
      icon: <PlayArrowIcon sx={{ color: 'info.main', fontSize: 32 }} />,
      value: queueStats.active,
      label: 'Em Execução',
      emoji: '▶️',
      color: 'info' as const,
      tooltip: 'Jobs sendo processados neste momento. Certificações em andamento.',
      helpTitle: 'Em Execução',
      helpDescription: 'Jobs sendo processados agora. Cada job certifica múltiplos modelos em paralelo nas regiões AWS selecionadas.'
    },
    {
      icon: <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />,
      value: queueStats.completed,
      label: 'Completos',
      emoji: '✅',
      color: 'success' as const,
      tooltip: 'Jobs concluídos com sucesso. Modelos certificados e prontos para uso.',
      helpTitle: 'Completos',
      helpDescription: 'Jobs finalizados com sucesso. Todos os modelos foram certificados e estão disponíveis para uso.'
    },
    {
      icon: <ErrorIcon sx={{ color: 'error.main', fontSize: 32 }} />,
      value: queueStats.failed,
      label: 'Falhados',
      emoji: '❌',
      color: 'error' as const,
      tooltip: 'Jobs que falharam durante a execução. Verifique os logs para mais detalhes.',
      helpTitle: 'Falhados',
      helpDescription: 'Jobs que encontraram erros durante a execução. Clique no job no histórico para ver detalhes do erro.'
    }
  ];

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          📊 Visão geral em tempo real da fila de certificação de modelos AWS Bedrock
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {statsConfig.map((config, index) => (
          <StatCard key={index} {...config} />
        ))}
      </Grid>
    </Box>
  );
}

