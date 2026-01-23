// frontend/src/features/chat/components/ControlPanel/PanelSection.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Paper, PaperProps } from '@mui/material';
import { ReactNode } from 'react';

interface PanelSectionProps extends PaperProps {
  children: ReactNode;
  active?: boolean; // Para destacar seções ativas (ex: modo manual ligado)
  disabled?: boolean; // Para desabilitar visualmente a seção
}

export const PanelSection = ({ children, active = false, disabled = false, sx, ...props }: PanelSectionProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        // Design System: Background adaptativo com tokens do tema
        bgcolor: disabled
          ? 'backgrounds.disabledSubtle'
          : active
            ? 'backgrounds.paperTransparent'
            : 'backgrounds.defaultTransparent',
        borderColor: disabled ? 'action.disabled' : active ? 'warning.main' : 'divider',
        borderWidth: active && !disabled ? 2 : 1,
        transition: 'all 0.3s ease',
        pointerEvents: disabled ? 'none' : 'auto',
        ...sx
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};
