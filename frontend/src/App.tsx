// frontend/src/App.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { HeaderSlotsProvider } from './contexts/HeaderSlotsContext';

// Audit
import { AuditProvider } from './features/audit/context/AuditContext';
import { AuditFeature } from './features/audit';

// Pages & Features
import AuditPage from './features/auditPage';
import { PromptTracePage } from "@/features/promptTrace";

// Components & Pages
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './features/chat';
import Settings from './features/settings';

function AppRoutes() {
  return (
    <>
      <CssBaseline />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<MainLayout />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:chatId" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/prompt-trace" element={<PromptTracePage />} />
          <Route path="/prompt-trace/:traceId" element={<PromptTracePage />} />

        </Route>

        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <HeaderSlotsProvider>
      <LayoutProvider>
        <AuthProvider>
          <CustomThemeProvider>
            <AuditProvider>
              {/* Auditoria global */}
              <AuditFeature />

              {/* Rotas */}
              <AppRoutes />
            </AuditProvider>
          </CustomThemeProvider>
        </AuthProvider>
      </LayoutProvider>
    </HeaderSlotsProvider>
  );
}

export default App;



/*
TODO: catch-all e página que recebe esses catch-all
Isso costuma acontecer quando existe um catch-all tipo:

<Route path="*" element={<Navigate to="/" replace />} />


ou algum guard que te manda pra home quando a rota não bate.


*/