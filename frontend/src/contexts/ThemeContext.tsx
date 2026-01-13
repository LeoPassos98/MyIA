// frontend/src/contexts/ThemeContext.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles'; // <--- O IMPORT QUE FALTAVA
import { useAuth } from './AuthContext';
import { userSettingsService } from '../services/userSettingsService';
import { createAppTheme } from '../theme';

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
      const token = localStorage.getItem('token');
      console.log('[ThemeContext] Token antes de buscar tema:', token);
      try {
        const settings = await userSettingsService.getSettings();
        // Garante que o valor vindo do banco seja válido, senão usa light
        setMode(settings.theme === 'dark' ? 'dark' : 'light');
      } catch (error) {
        console.error("Erro ao buscar tema:", error);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const toggleTheme = useCallback(async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode); // Atualiza o React instantaneamente
    
    // Atualiza o DB silenciosamente
    if (isAuthenticated) {
      try {
        await userSettingsService.updateSettings({ theme: newMode });
      } catch (error) {
        console.error("Erro ao salvar tema:", error);
      }
    }
  }, [mode, isAuthenticated]);

  const value = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  // Gera o objeto de tema do MUI baseado no modo atual
  const theme = useMemo(
    () => createAppTheme(mode),
    [mode],
  );

  return (
    // O ThemeProvider do MUI envolve nossa aplicação injetando as cores
    <ThemeProvider theme={theme}>
      {/* O Nosso Contexto expõe a função de toggle para os botões */}
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