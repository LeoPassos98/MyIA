// frontend-admin/src/components/Certifications/HelpTooltip.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Tooltip, IconButton, Box, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface HelpTooltipProps {
  title: string;
  description?: string | React.ReactNode;
  icon?: 'help' | 'info';
  size?: 'small' | 'medium';
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Componente reutilizável para exibir tooltips de ajuda
 * Usado para adicionar contexto e explicações em toda a interface
 */
export function HelpTooltip({ 
  title, 
  description, 
  icon = 'help', 
  size = 'small',
  placement = 'top'
}: HelpTooltipProps) {
  const tooltipContent = description ? (
    <Box>
      <Typography variant="caption" display="block" fontWeight="bold" mb={0.5}>
        {title}
      </Typography>
      {typeof description === 'string' ? (
        <Typography variant="caption" display="block">
          {description}
        </Typography>
      ) : (
        description
      )}
    </Box>
  ) : (
    title
  );

  const IconComponent = icon === 'help' ? HelpOutlineIcon : InfoOutlinedIcon;

  return (
    <Tooltip 
      title={tooltipContent} 
      arrow 
      placement={placement}
      enterDelay={300}
      leaveDelay={200}
    >
      <IconButton 
        size={size}
        sx={{ 
          padding: size === 'small' ? 0.5 : 1,
          color: 'text.secondary',
          '&:hover': {
            color: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <IconComponent fontSize={size} />
      </IconButton>
    </Tooltip>
  );
}
