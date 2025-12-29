// frontend/src/features/promptTrace/components/PromptTraceTimeline.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import type { PromptTraceStep } from '../types';

interface Props {
  steps: PromptTraceStep[];
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
}

const ROLE_CONFIG: Record<
  PromptTraceStep['role'],
  { icon: React.ReactNode; label: string; color: string }
> = {
  system: { icon: <SettingsIcon />, label: 'System', color: 'info' },
  user: { icon: <PersonIcon />, label: 'User', color: 'primary' },
  assistant: { icon: <SmartToyIcon />, label: 'Assistant', color: 'success' },
  tool: { icon: <BuildIcon />, label: 'Tool', color: 'warning' },
};

/**
 * Timeline de steps do trace
 */
export function PromptTraceTimeline({ steps, selectedStepId, onStepSelect }: Props) {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Timeline ({steps.length} steps)
      </Typography>

      <List disablePadding>
        {steps.map((step) => {
          const config = ROLE_CONFIG[step.role];
          const isSelected = selectedStepId === step.stepId;

          return (
            <ListItemButton
              key={step.stepId}
              selected={isSelected}
              onClick={() => onStepSelect(step.stepId)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected
                  ? alpha(theme.palette.primary.main, 0.08)
                  : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{config.icon}</ListItemIcon>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      #{step.stepNumber}
                    </Typography>
                    <Chip
                      label={config.label}
                      size="small"
                      color={config.color as 'primary'}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 200,
                    }}
                  >
                    {step.content.slice(0, 50)}
                    {step.content.length > 50 ? '...' : ''}
                  </Typography>
                }
              />

              {step.usage?.tokensOut && (
                <Chip
                  label={`${step.usage.tokensOut} tok`}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
