import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { userSettingsService } from '../services/userSettingsService';
import { createTheme, ThemeProvider } from '@mui/material/styles';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const { isAuthenticated } = useAuth();

  const fetchTheme = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const settings = await userSettingsService.getSettings();
        setMode(settings.theme);
      } catch (error) {
        console.error("Erro ao buscar tema:", error);
      }
    }
  }, [isAuthenticated]); // Depende de isAuthenticated

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]); // Roda quando 'fetchTheme' (e 'isAuthenticated') muda

  const toggleTheme = useCallback(async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode); // Atualiza o React
    try {
      await userSettingsService.updateSettings({ theme: newMode }); // Atualiza o DB
    } catch (error) {
      console.error("Erro ao salvar tema:", error);
    }
  }, [mode]); // Adiciona 'mode' como dependência

  const value = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode, // Suporte nativo ao Dark Mode
          primary: { main: '#667eea' },
          secondary: { main: '#764ba2' },
        },
        gradients: {
          primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          secondary: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          glass:
            mode === 'light'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(30,30,30,0.95) 100%)',
          shimmer:
            mode === 'light'
              ? 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%)',
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    </ThemeProvider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um CustomThemeProvider');
  }
  return context;
};
