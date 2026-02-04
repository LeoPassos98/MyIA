// frontend-admin/src/App.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { jwtDecode } from 'jwt-decode';
import { theme } from './theme/theme';
import { LoginPage } from './pages/Login';
import { CertificationsPage } from './pages/Certifications';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationSnackbar } from './components/common/NotificationSnackbar';
import { logger } from './utils/logger';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    logger.warn('Unauthorized access attempt - no token', { 
      component: 'PrivateRoute'
    });
    return <Navigate to="/login" />;
  }
  
  try {
    const decoded: any = jwtDecode(token);
    
    if (decoded.exp * 1000 < Date.now()) {
      logger.warn('Unauthorized access attempt - expired token', { 
        component: 'PrivateRoute',
        expiredAt: new Date(decoded.exp * 1000).toISOString()
      });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return <Navigate to="/login" />;
    }
    
    logger.debug('Token validated', { 
      component: 'PrivateRoute',
      userId: decoded.userId
    });
  } catch (error) {
    logger.error('Invalid token', { 
      component: 'PrivateRoute',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/certifications"
              element={
                <PrivateRoute>
                  <CertificationsPage />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/certifications" />} />
          </Routes>
        </BrowserRouter>
        <NotificationSnackbar />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
