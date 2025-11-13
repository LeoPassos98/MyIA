import { useState, useEffect, SyntheticEvent } from 'react';
import {
  Box, Typography, Container, Paper, FormControlLabel, Switch,
  Tabs, Tab, CircularProgress, Alert
} from '@mui/material';
import { BarChart, LineChart, ScatterChart } from '@mui/x-charts';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { analyticsService, AnalyticsData } from '../services/analyticsService';

// --- O Componente de Gráficos (Aba 4) ---
function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const analyticsData = await analyticsService.getAnalytics();
        setData(analyticsData);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar analytics:", err);
        setError("Não foi possível carregar os dados de analytics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  }

  if (!data) {
    return <Alert severity="info">Nenhum dado de analytics encontrado.</Alert>;
  }

  // Preparar dados para os gráficos
  const costOverTimeData = data.costOverTime.map(d => new Date(d.date));
  const costOverTimeSeries = [{ data: data.costOverTime.map(d => d.cost) }];
  
  const costEfficiencySeries = [{ data: data.costEfficiency.map(d => d.costPer1kTokens) }];
  const costEfficiencyProviders = data.costEfficiency.map(d => d.provider);

  const loadMapSeries = [{
    type: 'scatter' as const,
    data: data.loadMap.map(d => ({ x: d.tokensIn, y: d.tokensOut, id: Math.random() }))
  }];

  return (
    <Box>
      {/* --- Gráfico 1: O "Eletrocardiograma" --- */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Custo Total Diário (Últimos 30 dias)
      </Typography>
      <Paper sx={{ p: 2, height: 300 }}>
        {costOverTimeData.length > 0 ? (
          <LineChart
            xAxis={[{ data: costOverTimeData, scaleType: 'time' }]}
            series={costOverTimeSeries}
          />
        ) : <Typography>Sem dados de custo.</Typography>}
      </Paper>

      {/* --- Gráfico 2: O "Eficiencímetro" --- */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Custo por 1k Tokens de Saída (Eficiência)
      </Typography>
      <Paper sx={{ p: 2, height: 300 }}>
        {costEfficiencyProviders.length > 0 ? (
          <BarChart
            xAxis={[{ scaleType: 'band', data: costEfficiencyProviders }]}
            series={costEfficiencySeries}
          />
        ) : <Typography>Sem dados de eficiência.</Typography>}
      </Paper>
      
      {/* --- Gráfico 3: O "Mapa de Carga" --- */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Mapa de Carga (Entrada vs. Saída de Tokens)
      </Typography>
      <Paper sx={{ p: 2, height: 300 }}>
        {loadMapSeries[0].data.length > 0 ? (
          <ScatterChart
            xAxis={[{ label: 'Tokens de Entrada' }]}
            yAxis={[{ label: 'Tokens de Saída' }]}
            series={loadMapSeries}
          />
        ) : <Typography>Sem dados de carga.</Typography>}
      </Paper>
    </Box>
  );
}

// --- O Componente de Aparência (Aba 2) ---
function AppearanceTab() {
  const { mode, toggleTheme } = useTheme();
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Aparência
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={mode === 'dark'}
            onChange={toggleTheme}
          />
        }
        label={mode === 'dark' ? 'Modo Escuro Ativado' : 'Modo Claro Ativado'}
      />
    </Box>
  );
}

// --- O Container Principal (A Página) ---
export default function Settings() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  // Proteger a rota
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Painel de Controle
          </Typography>

          {/* --- O Navegador de Abas --- */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Painel de Controle">
              <Tab label="Perfil" />
              <Tab label="Aparência" />
              <Tab label="Chaves de API" />
              <Tab label="Analytics" />
            </Tabs>
          </Box>

          {/* --- Conteúdo das Abas --- */}
          {tabIndex === 0 && (
            <Box sx={{ p: 3 }}><Typography>Aba de Perfil (em construção)...</Typography></Box>
          )}
          {tabIndex === 1 && (
            <Box sx={{ p: 3 }}><AppearanceTab /></Box>
          )}
          {tabIndex === 2 && (
            <Box sx={{ p: 3 }}><Typography>Aba de Chaves de API (em construção)...</Typography></Box>
          )}
          {tabIndex === 3 && (
            <Box sx={{ p: 3 }}><AnalyticsTab /></Box>
          )}

        </Paper>
      </Container>
    </MainLayout>
  );
}
