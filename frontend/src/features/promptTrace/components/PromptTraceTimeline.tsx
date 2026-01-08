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
  Tooltip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import PushPinIcon from '@mui/icons-material/PushPin';
import PsychologyIcon from '@mui/icons-material/Psychology';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import type { PromptTraceStep, StepOrigin } from '../types';

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
 * Configuração de exibição para origens de mensagens
 */
const ORIGIN_CONFIG: Record<StepOrigin, { 
  label: string; 
  tooltip: string; 
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
}> = {
  pinned: { 
    label: '📌', 
    tooltip: 'Mensagem Fixada (sempre incluída)', 
    icon: <PushPinIcon fontSize="inherit" />,
    color: 'primary'
  },
  rag: { 
    label: '🧠', 
    tooltip: 'Recuperada via RAG (busca semântica)', 
    icon: <PsychologyIcon fontSize="inherit" />,
    color: 'secondary'
  },
  recent: { 
    label: '🕐', 
    tooltip: 'Memória Recente', 
    icon: <HistoryIcon fontSize="inherit" />,
    color: 'info'
  },
  'rag+recent': { 
    label: '🧠🕐', 
    tooltip: 'Encontrada via RAG e também é recente', 
    icon: <PsychologyIcon fontSize="inherit" />,
    color: 'success'
  },
  manual: { 
    label: '✋', 
    tooltip: 'Selecionada manualmente', 
    icon: <EditIcon fontSize="inherit" />,
    color: 'warning'
  },
  system: { 
    label: '⚙️', 
    tooltip: 'System Prompt', 
    icon: <SettingsIcon fontSize="inherit" />,
    color: 'info'
  },
  'user-input': { 
    label: '✏️', 
    tooltip: 'Mensagem atual do usuário', 
    icon: <PersonIcon fontSize="inherit" />,
    color: 'primary'
  },
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
                borderRadius: theme.shape.borderRadius,
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
                    {step.isPinned && (
                      <PushPinIcon 
                        fontSize="small" 
                        color="primary"
                        titleAccess="Mensagem fixada"
                        sx={{ ml: 0.5 }}
                      />
                    )}
                    {step.origin && ORIGIN_CONFIG[step.origin] && (
                      <Tooltip title={ORIGIN_CONFIG[step.origin].tooltip} arrow>
                        <Chip
                          label={ORIGIN_CONFIG[step.origin].label}
                          size="small"
                          color={ORIGIN_CONFIG[step.origin].color}
                          variant="filled"
                          sx={{ 
                            fontSize: '0.7rem', 
                            height: 20,
                            '& .MuiChip-label': { px: 0.75 }
                          }}
                        />
                      </Tooltip>
                    )}
                    {step.wasTruncatedForEmbedding && (
                      <Tooltip title="Embedding gerado de versão truncada (~8K tokens). A busca semântica pode não considerar todo o conteúdo." arrow>
                        <Chip
                          label="⚠️"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem', 
                            height: 20,
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      </Tooltip>
                    )}
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

              {/* Tokens da resposta (output) */}
              {step.usage?.tokensOut !== undefined && step.usage.tokensOut > 0 && (
                <Chip
                  label={`${step.usage.tokensOut} tok`}
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{ ml: 1 }}
                />
              )}
              {/* Tokens de entrada (input) - só mostra se não tiver tokensOut */}
              {step.usage?.tokensIn !== undefined && step.usage.tokensIn > 0 && !step.usage?.tokensOut && (
                <Chip
                  label={`${step.usage.tokensIn} tok`}
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
