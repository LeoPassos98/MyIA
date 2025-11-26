import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    gradients: {
      primary: string;
      secondary: string;
      glass: string;
      shimmer: string;
    };
  }
  interface ThemeOptions {
    gradients?: {
      primary?: string;
      secondary?: string;
      glass?: string;
      shimmer?: string;
    };
  }
}
