import { Paper, Box, Typography, alpha, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export const SettingsSection = ({ title, description, children }: SettingsSectionProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        // O Segredo do Design System:
        background: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(20px)',
        boxShadow: theme.shadows[4],
        transition: 'all 0.3s ease'
      }}
    >
      {title && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      )}
      
      {children}
    </Paper>
  );
};
