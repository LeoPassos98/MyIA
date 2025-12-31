// frontend/src/features/settings/components/AnalyticsTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, alpha, useTheme } from '@mui/material';
import { BarChart, LineChart } from '@mui/x-charts';
import { analyticsService, AnalyticsData } from '../../../services/analyticsService';
import { SettingsSection } from './SettingsSection';

export default function AnalyticsTab() {
  const theme = useTheme();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const analyticsData = await analyticsService.getAnalytics();
        setData(analyticsData);
      } catch (err) {
        setError("Não foi possível carregar os dados de analytics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Alert severity="info">Sem dados disponíveis.</Alert>;

  // Estilo comum para os gráficos
  const chartContainerStyle = {
    p: 2, 
    height: 320, 
    borderRadius: 2,
    bgcolor: alpha(theme.palette.background.default, 0.3),
    border: '1px solid',
    borderColor: 'divider',
    mb: 4
  };

  return (
    <SettingsSection title="Analytics" description="Métricas de uso e custos da sua IA.">
      
      <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.primary">
        Custo Total Diário (30 dias)
      </Typography>
      <Paper elevation={0} sx={chartContainerStyle}>
        <LineChart
          height={280}
          xAxis={[{ data: data.costOverTime.map(d => new Date(d.date)), scaleType: 'time' }]}
          series={[{ data: data.costOverTime.map(d => d.cost), color: theme.palette.primary.main }]}
          grid={{ vertical: true, horizontal: true }}
        />
      </Paper>

      <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.primary">
        Eficiência (Custo por 1k Tokens)
      </Typography>
      <Paper elevation={0} sx={chartContainerStyle}>
        <BarChart
          height={280}
          xAxis={[{ scaleType: 'band', data: data.costEfficiency.map(d => d.provider) }]}
          series={[{ data: data.costEfficiency.map(d => d.costPer1kTokens), color: theme.palette.secondary.main }]}
          grid={{ horizontal: true }}
        />
      </Paper>
    </SettingsSection>
  );
}
