// frontend/src/features/chat/components/ControlPanel/HelpTooltip.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Tooltip, Box, Typography, alpha, useTheme } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import { ReactNode } from 'react';

interface HelpTooltipProps {
  title: string;
  description: string;
  examples?: string[];
}

export const HelpTooltip = ({ title, description, examples }: HelpTooltipProps) => {
  const theme = useTheme();

  const content: ReactNode = (
    <Box sx={{ p: 0.5, maxWidth: 280 }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: examples ? 1 : 0 }}>
        {description}
      </Typography>
      {examples && examples.length > 0 && (
        <Box sx={{ 
          mt: 1, 
          pt: 1, 
          borderTop: '1px solid',
          borderColor: alpha(theme.palette.common.white, 0.2)
        }}>
          <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
            Exemplos:
          </Typography>
          {examples.map((ex, i) => (
            <Typography key={i} variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
              • {ex}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip 
      title={content} 
      arrow 
      placement="top"
      enterDelay={200}
      leaveDelay={100}
    >
      <HelpIcon 
        sx={{ 
          fontSize: 16, 
          color: 'text.secondary', 
          opacity: 0.6,
          cursor: 'help',
          ml: 0.5,
          '&:hover': { opacity: 1, color: 'primary.main' }
        }} 
      />
    </Tooltip>
  );
};
