import { useState, useEffect, SyntheticEvent } from 'react';
import {
  Box, Typography, Container, Paper, FormControlLabel, Switch,
  Tabs, Tab, CircularProgress, Alert, TextField, Button, Grid
} from '@mui/material';
import { BarChart, LineChart, ScatterChart } from '@mui/x-charts';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { analyticsService, AnalyticsData } from '../services/analyticsService';
import { userSettingsService, UserSettings } from '../services/userSettingsService';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

// --- O Componente de API Keys (Aba 3) ---
interface ApiKeysTabProps {
  userSettings: UserSettings | null;
  setUserSettings: (settings: UserSettings) => void;
}

function ApiKeysTab({ userSettings, setUserSettings }: ApiKeysTabProps) {
  const [formData, setFormData] = useState({
    openaiApiKey: '',
    groqApiKey: '',
    claudeApiKey: '',
    togetherApiKey: '',
    perplexityApiKey: '',
    mistralApiKey: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Atualiza o formulário quando userSettings mudar
  useEffect(() => {
    if (userSettings) {
      setFormData({
        openaiApiKey: (userSettings as any).openaiApiKey || '',
        groqApiKey: (userSettings as any).groqApiKey || '',
        claudeApiKey: (userSettings as any).claudeApiKey || '',
        togetherApiKey: (userSettings as any).togetherApiKey || '',
        perplexityApiKey: (userSettings as any).perplexityApiKey || '',
        mistralApiKey: (userSettings as any).mistralApiKey || '',
      });
    }
  }, [userSettings]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    setSaveSuccess(false); // Limpa mensagem de sucesso ao editar
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Filtra apenas os campos que foram preenchidos
      const dataToUpdate: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          dataToUpdate[key] = value;
        }
      });

      const updatedSettings = await userSettingsService.updateSettings(dataToUpdate);
      setUserSettings(updatedSettings);
      setSaveSuccess(true);
      
      // Limpa mensagem de sucesso após 3 segundos
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar chaves:', error);
      setSaveError('Erro ao salvar as chaves de API. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Chaves de API
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure suas chaves de API para os diferentes providers de IA. As chaves são criptografadas e armazenadas com segurança.
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Chaves salvas com sucesso!
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="OpenAI API Key"
            type="password"
            value={formData.openaiApiKey}
            onChange={handleChange('openaiApiKey')}
            placeholder="sk-..."
            helperText="Para GPT-3.5, GPT-4, etc"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Groq API Key"
            type="password"
            value={formData.groqApiKey}
            onChange={handleChange('groqApiKey')}
            placeholder="gsk_..."
            helperText="Para LLaMA 3.1 (gratuito)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Claude API Key (Anthropic)"
            type="password"
            value={formData.claudeApiKey}
            onChange={handleChange('claudeApiKey')}
            placeholder="sk-ant-..."
            helperText="Para Claude 3.5 Sonnet"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Together.ai API Key"
            type="password"
            value={formData.togetherApiKey}
            onChange={handleChange('togetherApiKey')}
            placeholder="..."
            helperText="Para LLaMA, Mixtral, etc"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Perplexity API Key"
            type="password"
            value={formData.perplexityApiKey}
            onChange={handleChange('perplexityApiKey')}
            placeholder="..."
            helperText="Para Sonar models"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Mistral API Key"
            type="password"
            value={formData.mistralApiKey}
            onChange={handleChange('mistralApiKey')}
            placeholder="..."
            helperText="Para Mistral Small, Medium, etc"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : 'Salvar Chaves'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            if (userSettings) {
              setFormData({
                openaiApiKey: (userSettings as any).openaiApiKey || '',
                groqApiKey: (userSettings as any).groqApiKey || '',
                claudeApiKey: (userSettings as any).claudeApiKey || '',
                togetherApiKey: (userSettings as any).togetherApiKey || '',
                perplexityApiKey: (userSettings as any).perplexityApiKey || '',
                mistralApiKey: (userSettings as any).mistralApiKey || '',
              });
            }
          }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
}

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

// --- O Componente de Perfil (Aba 1) ---
function ProfileTab() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSavingName, setIsSavingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Atualiza nome quando user mudar
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSaveName = async () => {
    try {
      setIsSavingName(true);
      setNameError(null);
      
      if (!name.trim()) {
        setNameError('O nome não pode estar vazio');
        return;
      }

      const updatedUser = await userService.updateProfile({ name });
      
      // Atualizar o contexto de autenticação
      if (setUser) {
        setUser(updatedUser);
      }
      
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error);
      setNameError(error.response?.data?.error || 'Erro ao atualizar nome');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsChangingPassword(true);
      setPasswordError(null);

      // Validações frontend
      if (!oldPassword || !newPassword || !confirmPassword) {
        setPasswordError('Todos os campos são obrigatórios');
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('A nova senha e a confirmação não coincidem');
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError('A nova senha deve ter no mínimo 6 caracteres');
        return;
      }

      await authService.changePassword({ oldPassword, newPassword });
      
      // Limpar campos
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      console.error('Erro ao mudar senha:', error);
      setPasswordError(error.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Box>
      {/* --- Seção 1: Perfil --- */}
      <Typography variant="h6" gutterBottom>
        Informações do Perfil
      </Typography>

      {nameSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Nome atualizado com sucesso!
        </Alert>
      )}

      {nameError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {nameError}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            value={user?.email || ''}
            disabled
            helperText="O email não pode ser alterado"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="Seu nome de exibição"
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={handleSaveName}
            disabled={isSavingName || name === user?.name}
          >
            {isSavingName ? 'Salvando...' : 'Salvar Alterações (Nome)'}
          </Button>
        </Grid>
      </Grid>

      {/* --- Seção 2: Segurança --- */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Alterar Senha
      </Typography>

      {passwordSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Senha alterada com sucesso!
        </Alert>
      )}

      {passwordError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {passwordError}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="password"
            label="Senha Atual"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="password"
            label="Nova Senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Mínimo 6 caracteres"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="password"
            label="Confirmar Nova Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="warning"
            onClick={handleChangePassword}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Alterando...' : 'Definir Nova Senha'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

// --- O Container Principal (A Página) ---
export default function Settings() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar configurações do usuário ao carregar
  useEffect(() => {
    const fetchSettings = async () => {
      if (isAuthenticated) {
        try {
          setIsLoading(true);
          const settings = await userSettingsService.getSettings();
          setUserSettings(settings);
          setError(null);
        } catch (err) {
          console.error("Erro ao buscar configurações:", err);
          setError("Não foi possível carregar as configurações.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSettings();
  }, [isAuthenticated]);

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

  if (isLoading) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </MainLayout>
    );
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
            <Box sx={{ p: 3 }}><ProfileTab /></Box>
          )}
          {tabIndex === 1 && (
            <Box sx={{ p: 3 }}><AppearanceTab /></Box>
          )}
          {tabIndex === 2 && (
            <Box sx={{ p: 3 }}>
              <ApiKeysTab 
                userSettings={userSettings} 
                setUserSettings={setUserSettings}
              />
            </Box>
          )}
          {tabIndex === 3 && (
            <Box sx={{ p: 3 }}><AnalyticsTab /></Box>
          )}

        </Paper>
      </Container>
    </MainLayout>
  );
}
