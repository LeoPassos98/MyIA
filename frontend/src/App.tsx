// frontend/src/App.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext'; 

// Components & Pages
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './features/chat';
import Settings from './features/settings';

/**
 * Componente de Rotas
 * Agora ele é "burro" em relação ao tema. Ele apenas consome o ambiente já configurado.
 */
function AppRoutes() {
  return (
    <>
      {/* CssBaseline reseta o CSS do navegador (padding, margin, fontes) */}
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
    </>
  );
}

/**
 * Componente Raiz
 * Apenas organiza a pirâmide de Provedores.
 */
function App() {
  return (
    <LayoutProvider>
      <AuthProvider>
        {/* O CustomThemeProvider já injeta o tema do MUI aqui dentro */}
        <CustomThemeProvider>
          <AppRoutes />
        </CustomThemeProvider>
      </AuthProvider>
    </LayoutProvider>
  );
}

export default App;