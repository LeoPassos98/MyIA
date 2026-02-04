// frontend-admin/src/components/Certifications/StatsOverview.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Grid, Card, CardContent, Typography, CircularProgress, Tooltip } from '@mui/material';
import { useStats } from '../../hooks/useStats';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { HelpTooltip } from './HelpTooltip';
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

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          📊 Visão geral em tempo real da fila de certificação de modelos AWS Bedrock
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Card: Waiting */}
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip 
            title="Jobs aguardando na fila para serem processados. Serão executados assim que houver capacidade disponível."
            arrow
            placement="top"
          >
            <Card 
              sx={{ 
                cursor: 'help',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={(theme) => ({
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: theme.palette.backgrounds.warningSubtle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      })}
                    >
                      <PendingIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {queueStats.waiting}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ⏳ Na Fila
                      </Typography>
                    </Box>
                  </Box>
                  <HelpTooltip
                    title="Na Fila"
                    description="Jobs aguardando para serem processados. Eles serão executados automaticamente quando houver capacidade disponível no sistema."
                  />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        {/* Card: Active */}
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip 
            title="Jobs sendo processados neste momento. Certificações em andamento."
            arrow
            placement="top"
          >
            <Card 
              sx={{ 
                cursor: 'help',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={(theme) => ({
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: theme.palette.backgrounds.infoSubtle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      })}
                    >
                      <PlayArrowIcon sx={{ color: 'info.main', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {queueStats.active}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ▶️ Em Execução
                      </Typography>
                    </Box>
                  </Box>
                  <HelpTooltip
                    title="Em Execução"
                    description="Jobs sendo processados agora. Cada job certifica múltiplos modelos em paralelo nas regiões AWS selecionadas."
                  />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        {/* Card: Completed */}
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip 
            title="Jobs concluídos com sucesso. Modelos certificados e prontos para uso."
            arrow
            placement="top"
          >
            <Card 
              sx={{ 
                cursor: 'help',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={(theme) => ({
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      })}
                    >
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {queueStats.completed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ✅ Completos
                      </Typography>
                    </Box>
                  </Box>
                  <HelpTooltip
                    title="Completos"
                    description="Jobs finalizados com sucesso. Todos os modelos foram certificados e estão disponíveis para uso."
                  />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        {/* Card: Failed */}
        <Grid item xs={12} sm={6} md={3}>
          <Tooltip 
            title="Jobs que falharam durante a execução. Verifique os logs para mais detalhes."
            arrow
            placement="top"
          >
            <Card 
              sx={{ 
                cursor: 'help',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={(theme) => ({
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      })}
                    >
                      <ErrorIcon sx={{ color: 'error.main', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {queueStats.failed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ❌ Falhados
                      </Typography>
                    </Box>
                  </Box>
                  <HelpTooltip
                    title="Falhados"
                    description="Jobs que encontraram erros durante a execução. Clique no job no histórico para ver detalhes do erro."
                  />
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
}
