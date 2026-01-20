// frontend/src/components/PerformanceDashboard.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Collapse,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { perfMonitor, PerformanceStats } from '@/services/performanceMonitor';
import { useWebVitals, useMemoryMonitoring, useLongTaskDetection } from '@/hooks/usePerformanceTracking';

interface PerformanceDashboardProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Dashboard de Performance (visível apenas em desenvolvimento)
 * 
 * Exibe métricas em tempo real:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Uso de memória
 * - Long Tasks detectadas
 * - Métricas customizadas
 * 
 * @example
 * ```tsx
 * // Em App.tsx (apenas em dev)
 * {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
 * ```
 */
export function PerformanceDashboard({ position = 'bottom-right' }: PerformanceDashboardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, PerformanceStats | null>>({});
  
  const webVitals = useWebVitals();
  const memoryInfo = useMemoryMonitoring(5000);
  const { longTasks } = useLongTaskDetection();

  // Atualizar métricas a cada 2 segundos
  useEffect(() => {
    const updateMetrics = () => {
      const report = perfMonitor.exportReport();
      setMetrics(report.metrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calcular posição do dashboard
  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 9999,
      maxWidth: isExpanded ? '600px' : '350px',
      maxHeight: isExpanded ? '80vh' : '400px',
      overflow: 'auto',
    };

    switch (position) {
      case 'top-right':
        return { ...base, top: 16, right: 16 };
      case 'top-left':
        return { ...base, top: 16, left: 16 };
      case 'bottom-left':
        return { ...base, bottom: 16, left: 16 };
      case 'bottom-right':
      default:
        return { ...base, bottom: 16, right: 16 };
    }
  };

  // Avaliar status de uma métrica
  const getMetricStatus = (name: string, value: number): 'success' | 'warning' | 'error' => {
    if (name.includes('LCP')) {
      if (value < 2500) return 'success';
      if (value < 4000) return 'warning';
      return 'error';
    }
    if (name.includes('FID')) {
      if (value < 100) return 'success';
      if (value < 300) return 'warning';
      return 'error';
    }
    if (name.includes('CLS')) {
      if (value < 0.1) return 'success';
      if (value < 0.25) return 'warning';
      return 'error';
    }
    if (name.includes('render') || name.includes('duration')) {
      if (value < 16) return 'success';
      if (value < 50) return 'warning';
      return 'error';
    }
    return 'success';
  };

  // Formatar valor
  const formatValue = (value: number, name: string): string => {
    if (name.includes('CLS')) {
      return value.toFixed(3);
    }
    return value.toFixed(2) + 'ms';
  };

  if (!isOpen) return null;

  return (
    <Card sx={getPositionStyles()}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" />
            <Typography variant="h6" component="div">
              Performance Monitor
            </Typography>
          </Box>
          <Box>
            <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <IconButton size="small" onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Core Web Vitals */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Core Web Vitals
          </Typography>
          <Grid container spacing={1}>
            {webVitals.LCP && (
              <Grid item xs={6}>
                <Chip
                  label={`LCP: ${formatValue(webVitals.LCP, 'LCP')}`}
                  color={getMetricStatus('LCP', webVitals.LCP)}
                  size="small"
                  sx={{ width: '100%' }}
                />
              </Grid>
            )}
            {webVitals.FID && (
              <Grid item xs={6}>
                <Chip
                  label={`FID: ${formatValue(webVitals.FID, 'FID')}`}
                  color={getMetricStatus('FID', webVitals.FID)}
                  size="small"
                  sx={{ width: '100%' }}
                />
              </Grid>
            )}
            {webVitals.CLS !== undefined && (
              <Grid item xs={6}>
                <Chip
                  label={`CLS: ${formatValue(webVitals.CLS, 'CLS')}`}
                  color={getMetricStatus('CLS', webVitals.CLS)}
                  size="small"
                  sx={{ width: '100%' }}
                />
              </Grid>
            )}
            {webVitals.FCP && (
              <Grid item xs={6}>
                <Chip
                  label={`FCP: ${formatValue(webVitals.FCP, 'FCP')}`}
                  size="small"
                  sx={{ width: '100%' }}
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Memória */}
        {memoryInfo.usedJSHeapSize > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MemoryIcon fontSize="small" />
              <Typography variant="subtitle2">
                Memória: {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100}
              color={
                (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) > 0.8
                  ? 'error'
                  : (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) > 0.6
                  ? 'warning'
                  : 'primary'
              }
            />
          </Box>
        )}

        {/* Long Tasks */}
        {longTasks.length > 0 && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            {longTasks.length} Long Task{longTasks.length > 1 ? 's' : ''} detectada{longTasks.length > 1 ? 's' : ''}
          </Alert>
        )}

        {/* Métricas Detalhadas (Expandido) */}
        <Collapse in={isExpanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Métricas Customizadas
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Métrica</TableCell>
                    <TableCell align="right">Média</TableCell>
                    <TableCell align="right">P95</TableCell>
                    <TableCell align="right">Máx</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(metrics)
                    .filter(([_, stats]) => stats !== null)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([name, stats]) => {
                      if (!stats) return null;
                      return (
                        <TableRow key={name}>
                          <TableCell component="th" scope="row">
                            <Typography variant="caption" noWrap>
                              {name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatValue(stats.avg, name)}
                              color={getMetricStatus(name, stats.avg)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption">
                              {formatValue(stats.p95, name)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption">
                              {formatValue(stats.max, name)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Long Tasks Detalhadas */}
          {longTasks.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Long Tasks Recentes
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell align="right">Duração</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {longTasks.slice(-10).reverse().map((task, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="caption" noWrap>
                            {task.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${task.duration.toFixed(2)}ms`}
                            color="warning"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Collapse>

        {/* Footer */}
        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Atualizado a cada 2s • {Object.keys(metrics).length} métricas
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default PerformanceDashboard;
