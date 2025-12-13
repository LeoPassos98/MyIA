// frontend/src/theme.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { createTheme } from '@mui/material/styles';

// 1. Extensão de Tipagem
declare module '@mui/material/styles' {
  
  // --- Cores e Gradientes ---
  interface Palette {
    custom: {
      matrix: string;
      hackerBg: string;
    };
    gradients: {
      primary: string;
      secondary: string;
      glass: string;
      shimmer: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      matrix: string;
      hackerBg: string;
    };
    gradients?: {
      primary?: string;
      secondary?: string;
      glass?: string;
      shimmer?: string;
    };
  }

  // --- Tipografia Personalizada ---
  // Adicionamos 'monospace' como string válida dentro de theme.typography
  interface TypographyVariants {
    monospace: string;
  }
  interface TypographyVariantsOptions {
    monospace?: string;
  }
  
  // Essas interfaces garantem que theme.typography.monospace seja reconhecido
  interface Typography {
    monospace: string;
  }
  interface TypographyOptions {
    monospace?: string;
  }
}

// 2. Definição das Cores e Gradientes
const getDesignTokens = (mode: 'light' | 'dark') => {
  
  const gradients = {
    primary: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    secondary: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
    glass: 'rgba(255, 255, 255, 0.1)',
    shimmer: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
  };

  return {
    palette: {
      mode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#9c27b0',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      custom: {
        matrix: '#00FF41',
        hackerBg: '#0d1117',
      },
      gradients, // Injeta gradients dentro do palette
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      // Aqui definimos o valor real da fonte
      monospace: '"Fira Code", "Consolas", "Monaco", "Andale Mono", "Ubuntu Mono", monospace',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  };
};

export const createAppTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));