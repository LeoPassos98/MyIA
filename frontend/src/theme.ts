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
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#fff',
      },
      secondary: {
        main: '#ff8e53',      // Laranja principal
        light: '#ffb78fff',   // Laranja claro
        dark: '#bf5c00ff',       // Laranja escuro
        contrastText: '#fff',
      },
      error: {
        main: '#e53935',
        light: '#ff6659',
        dark: '#b71c1c',
        contrastText: '#fff',
      },
      warning: {
        main: '#ffb300',  
        light: '#ffe082',
        dark: '#c68400',
        contrastText: '#fff',
      },
      info: {
        main: '#0288d1',
        light: '#03a9f4',
        dark: '#01579b',
        contrastText: '#fff',
      },
      success: {
        main: '#43a047',
        light: '#66bb6a',
        dark: '#2e7d32',
        contrastText: '#fff',
      },
      grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
        A100: '#d5d5d5',
        A200: '#aaaaaa',
        A400: '#303030',
        A700: '#616161',
      },
      common: {
        black: '#000',
        white: '#fff',
      },
      divider: mode === 'dark' ? '#333' : '#e0e0e0',
      text: {
        primary: mode === 'dark' ? '#fff' : '#212121',
        secondary: mode === 'dark' ? '#bdbdbd' : '#757575',
        disabled: mode === 'dark' ? '#616161' : '#bdbdbd',
        hint: mode === 'dark' ? '#bdbdbd' : '#9e9e9e',
      },
      action: {
        active: mode === 'dark' ? '#fff' : '#212121',
        hover: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(33,33,33,0.08)',
        selected: mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(33,33,33,0.16)',
        disabled: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(33,33,33,0.3)',
        disabledBackground: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(33,33,33,0.12)',
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
      status: {
        warning: '#ffb300',
        info: '#0288d1',
        success: '#43a047',
        error: '#e53935',
      },
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