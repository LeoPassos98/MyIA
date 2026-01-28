// frontend/src/App.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { ProtectedRoute } from './components/ProtectedRoute';

// Estilos de integração do sistema de rating
import './styles/model-rating-integration.css';

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { HeaderSlotsProvider } from './contexts/HeaderSlotsContext';

// Audit
import { AuditProvider } from './features/audit/context/AuditContext';
import { AuditFeature } from './features/audit';

// ✅ FASE 5: Performance Monitoring
import { perfMonitor } from './services/performanceMonitor';
import { useWebVitals } from './hooks/usePerformanceTracking';

// ✅ FASE 3: Model Capabilities - Prefetch Hook
import { usePrefetchCapabilities } from './hooks/usePrefetchCapabilities';

// ✅ OTIMIZAÇÃO FASE 4: Code Splitting com React.lazy()
// Componentes pesados carregados sob demanda (50-60% redução no bundle inicial)

// Páginas públicas (carregamento imediato)
import Login from "./features/login/LoginPage";
import Register from "./features/register/RegisterPage";
import { AuthSuccess } from './pages/AuthSuccess';

// Layout principal (carregamento imediato)
import MainLayout from "./components/Layout/MainLayout";

// ✅ Lazy Loading: Páginas protegidas (carregadas sob demanda)
const Chat = lazy(() => import("./features/chat"));
const Settings = lazy(() => import('./features/settings'));
const AuditPage = lazy(() => import('./features/auditPage'));
const PromptTracePage = lazy(() => import("@/features/promptTrace").then(module => ({ default: module.PromptTracePage })));
const LandingPage = lazy(() => import('./features/landing/components/LandingPage'));

// ✅ FASE 5: Performance Dashboard (lazy load, apenas em dev)
const PerformanceDashboard = lazy(() => import('./components/PerformanceDashboard'));

// ✅ Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100%',
    }}
  >
    <CircularProgress />
  </Box>
);

// ✅ FASE 3: Configurar QueryClient para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações globais para queries
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5, // 5 minutos (default)
      gcTime: 1000 * 60 * 60, // 1 hora (default)
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <>
      <CssBaseline />

      <Routes>
        {/* Páginas públicas */}
        <Route path="/landing" element={
          <Suspense fallback={<LoadingFallback />}>
            <LandingPage />
          </Suspense>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Social Auth Success */}
        <Route path="/auth-success" element={<AuthSuccess />} />
        
        {/* Rotas protegidas com Suspense para lazy loading */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={
              <Suspense fallback={<LoadingFallback />}>
                <Chat />
              </Suspense>
            } />
            <Route path="/chat" element={
              <Suspense fallback={<LoadingFallback />}>
                <Chat />
              </Suspense>
            } />
            <Route path="/chat/:chatId" element={
              <Suspense fallback={<LoadingFallback />}>
                <Chat />
              </Suspense>
            } />
            <Route path="/settings" element={
              <Suspense fallback={<LoadingFallback />}>
                <Settings />
              </Suspense>
            } />
            <Route path="/audit" element={
              <Suspense fallback={<LoadingFallback />}>
                <AuditPage />
              </Suspense>
            } />
            <Route path="/prompt-trace" element={
              <Suspense fallback={<LoadingFallback />}>
                <PromptTracePage />
              </Suspense>
            } />
            <Route path="/prompt-trace/:traceId" element={
              <Suspense fallback={<LoadingFallback />}>
                <PromptTracePage />
              </Suspense>
            } />
          </Route>
        </Route>

        {/* catch-all: redireciona para landing */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes >
    </>
  );
}

function AppContent() {
  // ✅ FASE 5: Inicializar monitoramento de Web Vitals
  const webVitals = useWebVitals();

  // ✅ FASE 3: Prefetch de capabilities de todos os modelos
  usePrefetchCapabilities({
    enabled: true,
    onSuccess: (count) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [Capabilities] Prefetched ${count} models`);
      }
    },
    onError: (error) => {
      console.error('❌ [Capabilities] Prefetch failed:', error);
    },
  });

  // ✅ FASE 5: Log de métricas em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [Performance] App montado - Monitoramento ativo');
      console.log('📊 [Performance] Web Vitals:', webVitals);
    }

    // Cleanup ao desmontar
    return () => {
      if (process.env.NODE_ENV === 'development') {
        const report = perfMonitor.exportReport();
        console.log('📈 [Performance] Relatório final:', report);
      }
    };
  }, [webVitals]);

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

              {/* ✅ FASE 5: Performance Dashboard (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && (
                <Suspense fallback={null}>
                  <PerformanceDashboard position="bottom-right" />
                </Suspense>
              )}
            </AuditProvider>
          </CustomThemeProvider>
        </AuthProvider>
      </LayoutProvider>
    </HeaderSlotsProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;



/*
TODO: catch-all e página que recebe esses catch-all
Isso costuma acontecer quando existe um catch-all tipo:

<Route path="*" element={<Navigate to="/" replace />} />


ou algum guard que te manda pra home quando a rota não bate.


*/