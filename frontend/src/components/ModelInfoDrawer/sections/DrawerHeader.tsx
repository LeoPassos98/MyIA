// frontend/src/components/ModelInfoDrawer/sections/DrawerHeader.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MODULARIZED: Seção 15 - File Size Limits

import { Box, Typography, IconButton, useTheme, alpha } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface DrawerHeaderProps {
  onClose: () => void;
}

/**
 * Header do ModelInfoDrawer
 * 
 * Responsabilidades:
 * - Exibir título
 * - Botão de fechar
 * - Estilo consistente
 */
export function DrawerHeader({ onClose }: DrawerHeaderProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.primary.main, 0.05),
      }}
    >
      <Typography variant="h6" fontWeight="bold">
        Informações do Modelo
      </Typography>
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
