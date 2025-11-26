import { Paper, PaperProps, alpha, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface PanelSectionProps extends PaperProps {
  children: ReactNode;
  active?: boolean; // Para destacar seções ativas (ex: modo manual ligado)
}

export const PanelSection = ({ children, active = false, sx, ...props }: PanelSectionProps) => {
  const theme = useTheme();
  
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        // Design System: Background adaptativo com alpha
        bgcolor: active 
          ? alpha(theme.palette.background.paper, 0.8) 
          : alpha(theme.palette.background.default, 0.5),
        borderColor: active ? 'warning.main' : 'divider',
        borderWidth: active ? 2 : 1,
        transition: 'all 0.3s ease',
        ...sx
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};
