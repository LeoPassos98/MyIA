// frontend-admin/src/theme/theme.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { createTheme } from '@mui/material/styles';

// Extensão de tipagem para tokens customizados
declare module '@mui/material/styles' {
  interface Palette {
    backgrounds: {
      warningSubtle: string;
      infoSubtle: string;
      successSubtle: string;
      errorSubtle: string;
    };
  }
  interface PaletteOptions {
    backgrounds?: {
      warningSubtle?: string;
      infoSubtle?: string;
      successSubtle?: string;
      errorSubtle?: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    backgrounds: {
      warningSubtle: 'rgba(237, 108, 2, 0.1)',  // warning com 10% opacidade
      infoSubtle: 'rgba(2, 136, 209, 0.1)',     // info com 10% opacidade
      successSubtle: 'rgba(46, 125, 50, 0.1)',  // success com 10% opacidade
      errorSubtle: 'rgba(211, 47, 47, 0.1)',    // error com 10% opacidade
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
