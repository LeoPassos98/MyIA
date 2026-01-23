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
    backgrounds: {
      warningSubtle: string;
      warningHover: string;
      infoSubtle: string;
      secondarySubtle: string;
      secondaryHover: string;
      disabledSubtle: string;
      paperTransparent: string;
      defaultTransparent: string;
    };
    borders: {
      warningSubtle: string;
      infoSubtle: string;
      whiteSubtle: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      matrix?: string;
      hackerBg?: string;
    };
    gradients?: {
      primary?: string;
      secondary?: string;
      glass?: string;
      shimmer?: string;
    };
    backgrounds?: {
      warningSubtle?: string;
      warningHover?: string;
      infoSubtle?: string;
      secondarySubtle?: string;
      secondaryHover?: string;
      disabledSubtle?: string;
      paperTransparent?: string;
      defaultTransparent?: string;
    };
    borders?: {
      warningSubtle?: string;
      infoSubtle?: string;
      whiteSubtle?: string;
    };
  }

  // --- Tipografia Personalizada ---
  // Extendemos para suportar variantes customizadas como objetos de estilo
  interface TypographyVariants {
    monospace: React.CSSProperties;
    code: React.CSSProperties;
    title: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    monospace?: React.CSSProperties;
    code?: React.CSSProperties;
    title?: React.CSSProperties;
  }
}

// Suporte para o componente Typography do MUI reconhecer as variantes novas
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    monospace: true;
    code: true;
    title: true;
  }
}

// 2. Definição das Cores e Gradientes
const getDesignTokens = (mode: 'light' | 'dark') => {
  
  // Pilhas de fontes robustas
  const fontSans = '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  const fontTitle = '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const fontMono = '"Fira Code", "JetBrains Mono", "Cascadia Code", "Source Code Pro", Menlo, Monaco, "Consolas", monospace';

  const gradients = {
    primary: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    secondary: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
    glass: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
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
        main: '#ff8e53',
        light: '#ffb78fff',
        dark: '#bf5c00ff',
        contrastText: '#fff',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#fff' : '#212121',
        secondary: mode === 'dark' ? '#bdbdbd' : '#757575',
      },
      custom: {
        matrix: '#00FF41',
        hackerBg: '#0d1117',
      },
      gradients,
      backgrounds: {
        // Backgrounds sutis para alertas e seções
        warningSubtle: mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.1)',
        warningHover: mode === 'dark' ? 'rgba(255, 152, 0, 0.25)' : 'rgba(255, 152, 0, 0.2)',
        infoSubtle: mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
        secondarySubtle: mode === 'dark' ? 'rgba(255, 142, 83, 0.05)' : 'rgba(255, 142, 83, 0.08)',
        secondaryHover: mode === 'dark' ? 'rgba(255, 142, 83, 0.1)' : 'rgba(255, 142, 83, 0.12)',
        disabledSubtle: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        paperTransparent: mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        defaultTransparent: mode === 'dark' ? 'rgba(18, 18, 18, 0.5)' : 'rgba(245, 245, 245, 0.5)',
      },
      borders: {
        warningSubtle: mode === 'dark' ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.4)',
        infoSubtle: mode === 'dark' ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.4)',
        whiteSubtle: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      },
    },
    
    // --- TIPOGRAFIA REFINADA (RECOMENDAÇÃO PRO) ---
    typography: {
      fontFamily: fontSans,
      
      // Títulos principais
      h1: { fontFamily: fontTitle, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
      h2: { fontFamily: fontTitle, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' },
      h3: { fontFamily: fontTitle, fontWeight: 600, lineHeight: 1.3 },
      
      // Variantes de texto corrido
      body1: { 
        fontSize: '1rem', 
        lineHeight: 1.6, // Conforto para leitura de logs ou mensagens de IA
        letterSpacing: '0.009em' 
      },
      body2: { 
        fontSize: '0.875rem', 
        lineHeight: 1.57, 
        letterSpacing: '0.007em' 
      },

      // Estilos específicos para a sua aplicação técnica
      title: {
        fontFamily: fontTitle,
        fontWeight: 700,
        lineHeight: 1.2,
      },
      subtitle1: {
        fontFamily: fontSans,
        lineHeight: 1.5,
        fontWeight: 500,
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
        letterSpacing: '0.033em',
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'none' as const, // Mais moderno que o UPPERCASE padrão
      },

      // Suporte a código (Essencial para seu sistema de IA)
      monospace: {
        fontFamily: fontMono,
        fontWeight: 450,
      },
      code: {
        fontFamily: fontMono,
        fontSize: '0.9em',
        lineHeight: 1.5,
        backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
        padding: '2px 4px',
        borderRadius: '4px',
      },
    },

    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px', // Botões levemente arredondados combinam com Montserrat
          },
        },
      },
    },
  };
};

export const createAppTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));