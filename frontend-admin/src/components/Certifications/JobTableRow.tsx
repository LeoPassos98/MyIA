// frontend-admin/src/components/Certifications/JobTableRow.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import React from 'react';
import {
  Box,
  TableCell,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { JobStatus } from '../../services/certificationApi';
import { JobProgressBar } from './JobProgressBar';
import { JobDetailsRow } from './JobDetailsRow';

interface JobTableRowProps {
  job: JobStatus;
  isExpanded: boolean;
  onToggleExpand: (jobId: string) => void;
}

/**
 * Linha individual da tabela de jobs
 * Extraído do JobHistoryTable para reduzir tamanho do arquivo
 */
export function JobTableRow({ job, isExpanded, onToggleExpand }: JobTableRowProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PROCESSING':
        return 'info';
      case 'FAILED':
        return 'error';
      case 'QUEUED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'QUEUED':
        return <PendingIcon fontSize="small" />;
      case 'PROCESSING':
        return <CircularProgress size={20} />;
      case 'COMPLETED':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'FAILED':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      <TableRow 
        sx={{
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <TableCell>
          <Tooltip title={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes dos modelos'}>
            <IconButton
              size="small"
              onClick={() => onToggleExpand(job.id)}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Tooltip title={job.id}>
            <Typography variant="caption" fontFamily="monospace">
              {job.id.substring(0, 8)}...
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Chip 
            label={job.type === 'MULTIPLE_MODELS' ? 'Múltiplos' : 'Único'} 
            size="small" 
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {job.regions.slice(0, 2).map((region: string) => (
              <Chip key={region} label={region} size="small" />
            ))}
            {job.regions.length > 2 && (
              <Tooltip title={job.regions.join(', ')}>
                <Chip label={`+${job.regions.length - 2}`} size="small" />
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(job.status)}
            <Chip
              label={job.status}
              color={getStatusColor(job.status) as any}
              size="small"
            />
          </Box>
        </TableCell>
        <TableCell>
          <JobProgressBar job={job} />
        </TableCell>
        <TableCell>
          <Typography variant="caption">
            {new Date(job.createdAt).toLocaleString('pt-BR')}
          </Typography>
        </TableCell>
      </TableRow>
      <JobDetailsRow job={job} open={isExpanded} />
    </React.Fragment>
  );
}
