import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

/**
 * Componente Nº 1: O Aplicador de Tema
 * Este componente SÓ existe porque ele precisa estar "dentro" do CustomThemeProvider
 * para poder chamar o hook useTheme().
 */
function ThemedRoutes() {
  const { mode } = useTheme(); // <-- Agora isso funciona!

  // 1. Crie o tema do MUI baseado no 'mode' do nosso contexto
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode,
        },
      }),
    [mode],
  );

  // 2. Aplique o tema e o CSS Baseline, e então renderize as rotas
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </MuiThemeProvider>
  );
}

/**
 * Componente Nº 2: O "Provedor-Mor"
 * O App.tsx agora só se preocupa em configurar todos os contextos
 * (Roteador, Auth, e o nosso Tema).
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomThemeProvider>
          <ThemedRoutes />
        </CustomThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;