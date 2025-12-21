// frontend/src/features/auditPage/components/AuditSummaryCards.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Grid, Paper, Typography, Box } from '@mui/material';
import { AuditSummary } from '../hooks/useAuditSummary';

interface AuditSummaryCardsProps {
  summary: AuditSummary;
}

export function AuditSummaryCards({ summary }: AuditSummaryCardsProps) {
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString('pt-BR');
  };

  return (
    <Grid container spacing={2}>
      {/* Total de Registros */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total de Registros
          </Typography>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            {summary.totalRecords}
          </Typography>
        </Paper>
      </Grid>

      {/* Total de Tokens */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total de Tokens
          </Typography>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            {formatTokens(summary.totalTokens)}
          </Typography>
        </Paper>
      </Grid>

      {/* Custo Total */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Custo Total
          </Typography>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {formatCost(summary.totalCost)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              USD
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Custo Médio */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Custo Médio
          </Typography>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {formatCost(summary.avgCost)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              por registro
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
