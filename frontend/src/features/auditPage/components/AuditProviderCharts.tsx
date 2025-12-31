// frontend/src/features/auditPage/components/AuditProviderCharts.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Paper, Typography, Grid, useTheme, alpha } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProviderStats } from '../hooks/useAuditProviderStats';

/** Altura fixa dos gráficos em pixels - evita warning width(-1) do ResponsiveContainer */
const CHART_HEIGHT = 300;

interface AuditProviderChartsProps {
  stats: ProviderStats[];
}

export default function AuditProviderCharts({ stats }: AuditProviderChartsProps) {
  const theme = useTheme();

  // Retorna null se não houver dados
  if (!stats || stats.length === 0) {
    return null;
  }

  // Cores neutras do tema (sem semântica)
  const chartColors = {
    bar: alpha(theme.palette.text.primary, 0.35),
    grid: theme.palette.divider,
    text: theme.palette.text.secondary,
    tooltip: {
      background: theme.palette.background.paper,
      border: theme.palette.divider,
      text: theme.palette.text.primary,
    },
  };

  // Formata custo em USD
  const formatCost = (value: number) => {
    return `$${value.toFixed(4)}`;
  };

  // Formata tokens
  const formatTokens = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Análise por Provider
      </Typography>

      <Grid container spacing={3}>
        {/* Gráfico: Custo Total por Provider */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              Custo Total por Provider
            </Typography>
            {/* 
              IMPORTANTE: ResponsiveContainer com height em PIXELS (não percentual)
              Isso evita o warning "width(-1)" pois não depende do pai ter altura definida.
            */}
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="provider" 
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                  tickFormatter={formatCost}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltip.background,
                    border: `1px solid ${chartColors.tooltip.border}`,
                    borderRadius: 4,
                    color: chartColors.tooltip.text,
                  }}
                  formatter={(value: number | undefined) => [formatCost(value || 0), 'Custo']}
                  labelStyle={{ color: chartColors.tooltip.text }}
                />
                <Bar dataKey="totalCost" radius={[4, 4, 0, 0]}>
                  {stats.map((_, index) => (
                    <Cell key={`cell-cost-${index}`} fill={chartColors.bar} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico: Tokens Totais por Provider */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tokens Totais por Provider
            </Typography>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="provider" 
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                  tickFormatter={formatTokens}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltip.background,
                    border: `1px solid ${chartColors.tooltip.border}`,
                    borderRadius: 4,
                    color: chartColors.tooltip.text,
                  }}
                  formatter={(value: number | undefined) => [formatTokens(value || 0), 'Tokens']}
                  labelStyle={{ color: chartColors.tooltip.text }}
                />
                <Bar dataKey="totalTokens" radius={[4, 4, 0, 0]}>
                  {stats.map((_, index) => (
                    <Cell key={`cell-tokens-${index}`} fill={chartColors.bar} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
