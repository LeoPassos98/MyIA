// frontend-admin/src/components/Certifications/JobDetailsRow.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import {
  Box,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { JobStatus } from '../../services/certificationApi';
import { logger } from '../../utils/logger';

interface JobDetailsRowProps {
  job: JobStatus;
  open: boolean;
}

interface CertificationDetail {
  id: string;
  modelId: string;
  modelName: string;
  region: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

/**
 * Componente que exibe detalhes expandíveis de um job
 * Mostra lista de modelos sendo certificados com status individual
 */
export function JobDetailsRow({ job, open }: JobDetailsRowProps) {
  const [certifications, setCertifications] = useState<CertificationDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && certifications.length === 0) {
      loadCertifications();
    }
  }, [open]);

  const loadCertifications = async () => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Loading job certifications', {
        component: 'JobDetailsRow',
        jobId: job.id
      });

      // Os detalhes já vêm no job.certifications
      const details = job.certifications || [];
      
      // Mapear para formato esperado
      const mappedDetails: CertificationDetail[] = details.map((cert: any) => ({
        id: cert.id,
        modelId: cert.modelId,
        modelName: cert.model?.name || cert.modelId,
        region: cert.region,
        status: cert.status,
        startedAt: cert.startedAt,
        completedAt: cert.completedAt,
        error: cert.error || cert.errorMessage // Aceita ambos os campos para compatibilidade
      }));

      setCertifications(mappedDetails);

      logger.info('Job certifications loaded', {
        component: 'JobDetailsRow',
        jobId: job.id,
        count: mappedDetails.length
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar detalhes';
      setError(errorMessage);
      
      logger.error('Failed to load job certifications', {
        component: 'JobDetailsRow',
        jobId: job.id,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <PendingIcon fontSize="small" color="disabled" />;
      case 'RUNNING':
        return <PlayArrowIcon fontSize="small" color="info" />;
      case 'COMPLETED':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'FAILED':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'RUNNING':
        return 'info';
      case 'FAILED':
        return 'error';
      case 'PENDING':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return '-';
    
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const diffMs = end - start;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffMin > 0) {
      return `${diffMin}m ${diffSec % 60}s`;
    }
    return `${diffSec}s`;
  };

  return (
    <TableRow>
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ margin: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              📋 Modelos Certificados neste Job
            </Typography>

            {loading && (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!loading && !error && certifications.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Nenhum modelo encontrado para este job
              </Alert>
            )}

            {!loading && !error && certifications.length > 0 && (
              <Table size="small" aria-label="detalhes dos modelos">
                <TableHead>
                  <TableRow>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Região</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Tempo</TableCell>
                    <TableCell>Detalhes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certifications.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {cert.modelName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {cert.modelId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={cert.region} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(cert.status)}
                          <Chip
                            label={cert.status}
                            color={getStatusColor(cert.status) as any}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDuration(cert.startedAt, cert.completedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {cert.error ? (
                          <Typography variant="caption" color="error">
                            ❌ {cert.error}
                          </Typography>
                        ) : cert.status === 'COMPLETED' ? (
                          <Typography variant="caption" color="success.main">
                            ✅ Sucesso
                          </Typography>
                        ) : cert.status === 'RUNNING' ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <CircularProgress size={12} />
                            <Typography variant="caption">
                              Processando...
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Aguardando
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Barra de progresso visual */}
            {certifications.length > 0 && (
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Progresso Geral
                  </Typography>
                  <Typography variant="caption" fontWeight="medium">
                    {job.processedModels}/{job.totalModels} modelos
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(job.processedModels / job.totalModels) * 100}
                  sx={{ height: 6, borderRadius: 1 }}
                />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="caption" color="success.main">
                    ✓ {job.successCount} sucessos
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    ✗ {job.failureCount} falhas
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );
}
