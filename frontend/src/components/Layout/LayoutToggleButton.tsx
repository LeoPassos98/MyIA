// frontend/src/components/Layout/LayoutToggleButton.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface LayoutToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  title: string;
  gradient: string;
  placement?: 'bottom' | 'left' | 'right';
}

export default function LayoutToggleButton({
  isActive,
  onClick,
  icon,
  activeIcon,
  title,
  gradient,
  placement = 'bottom',
}: LayoutToggleButtonProps) {
  const theme = useTheme();

  return (
    <Tooltip title={title} arrow placement={placement}>
      <IconButton
        onClick={onClick}
        sx={{
          background: isActive ? gradient : alpha(theme.palette.primary.main, 0.08),
          color: isActive ? 'white' : theme.palette.primary.main,
          borderRadius: 2,
          transition: 'all 0.3s ease',
          border: '1px solid',
          borderColor: isActive ? 'transparent' : alpha(theme.palette.primary.main, 0.2),
          '&:hover': {
            background: isActive ? gradient : alpha(theme.palette.primary.main, 0.15),
            transform: 'scale(1.05)',
            boxShadow: isActive
              ? `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`
              : `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        }}
      >
        {isActive ? activeIcon : icon}
      </IconButton>
    </Tooltip>
  );
}
