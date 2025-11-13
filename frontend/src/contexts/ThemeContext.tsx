import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { userSettingsService } from '../services/userSettingsService';

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

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode); // Atualiza o React
    try {
      await userSettingsService.updateSettings({ theme: newMode }); // Atualiza o DB
    } catch (error) {
      console.error("Erro ao salvar tema:", error);
    }
  };

  const value = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um CustomThemeProvider');
  }
  return context;
};
