// frontend/src/theme/scrollbarStyles.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { SxProps, Theme } from '@mui/material';

/**
 * Estilos de scrollbar consistentes que se adaptam ao tema (claro/escuro)
 * Use este objeto em qualquer componente com overflow: auto/scroll
 */
export const scrollbarStyles: SxProps<Theme> = {
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px', // Para scrollbar horizontal
  },
  '&::-webkit-scrollbar-track': {
    bgcolor: 'background.default',
  },
  '&::-webkit-scrollbar-thumb': {
    bgcolor: 'text.secondary',
    opacity: 0.2,
    borderRadius: '4px',
    '&:hover': {
      opacity: 0.3,
    },
  },
};
