import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo } from 'react';
import { LayoutProvider } from './contexts/LayoutContext'; 
import MainLayout from './components/Layout/MainLayout';
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

        <Route element={<MainLayout />}>
           <Route path="/chat" element={<Chat />} />
           <Route path="/chat/:chatId" element={<Chat />} />
           <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </MuiThemeProvider>
  );
}

/**
 * Componente Nº 2: O "Provedor-Mor"
 * ORDEM CORRETA V47:
 * 1. LayoutProvider (precisa estar disponível para todos os componentes)
 * 2. AuthProvider (usa LayoutProvider internamente se necessário)
 * 3. CustomThemeProvider (usa estado mas não depende de rotas)
 * 4. ThemedRoutes (contém Routes - deve estar por último)
 * 
 * NOTA: O BrowserRouter deve estar em main.tsx envolvendo o <App />
 */
function App() {
  return (
    <LayoutProvider>
      <AuthProvider>
        <CustomThemeProvider>
          <ThemedRoutes />
        </CustomThemeProvider>
      </AuthProvider>
    </LayoutProvider>
  );
}

export default App;