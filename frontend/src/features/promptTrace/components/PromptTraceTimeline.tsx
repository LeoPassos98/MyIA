// frontend/src/features/promptTrace/components/PromptTraceTimeline.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// MIGRATED: Fase 3 - Padronização Visual

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  useTheme,
  Tooltip,
} from '@mui/material';
import { StatusBadge, MetricBadge } from '@/components/Badges';
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
  { icon: React.ReactNode; label: string; status: 'success' | 'warning' | 'error' | 'info' | 'default' }
> = {
  system: { icon: <SettingsIcon />, label: 'System', status: 'info' },
  user: { icon: <PersonIcon />, label: 'User', status: 'info' },
  assistant: { icon: <SmartToyIcon />, label: 'Assistant', status: 'success' },
  tool: { icon: <BuildIcon />, label: 'Tool', status: 'warning' },
};

/**
 * Configuração de exibição para origens de mensagens
 */
const ORIGIN_CONFIG: Record<StepOrigin, { 
  label: string; 
  tooltip: string; 
  icon: React.ReactNode;
  status: 'success' | 'warning' | 'error' | 'info' | 'default';
}> = {
  pinned: { 
    label: '📌', 
    tooltip: 'Mensagem Fixada (sempre incluída)', 
    icon: <PushPinIcon fontSize="inherit" />,
    status: 'info'
  },
  rag: { 
    label: '🧠', 
    tooltip: 'Recuperada via RAG (busca semântica)', 
    icon: <PsychologyIcon fontSize="inherit" />,
    status: 'info'
  },
  recent: { 
    label: '🕐', 
    tooltip: 'Memória Recente', 
    icon: <HistoryIcon fontSize="inherit" />,
    status: 'info'
  },
  'rag+recent': { 
    label: '🧠🕐', 
    tooltip: 'Encontrada via RAG e também é recente', 
    icon: <PsychologyIcon fontSize="inherit" />,
    status: 'success'
  },
  manual: { 
    label: '✋', 
    tooltip: 'Selecionada manualmente', 
    icon: <EditIcon fontSize="inherit" />,
    status: 'warning'
  },
  system: { 
    label: '⚙️', 
    tooltip: 'System Prompt', 
    icon: <SettingsIcon fontSize="inherit" />,
    status: 'info'
  },
  'user-input': { 
    label: '✏️', 
    tooltip: 'Mensagem atual do usuário', 
    icon: <PersonIcon fontSize="inherit" />,
    status: 'info'
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
                    <StatusBadge
                      label={config.label}
                      status={config.status}
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
                        <StatusBadge
                          label={ORIGIN_CONFIG[step.origin].label}
                          status={ORIGIN_CONFIG[step.origin].status}
                        />
                      </Tooltip>
                    )}
                    {step.wasTruncatedForEmbedding && (
                      <Tooltip title="Embedding gerado de versão truncada (~8K tokens). A busca semântica pode não considerar todo o conteúdo." arrow>
                        <StatusBadge
                          label="⚠️"
                          status="warning"
                          variant="outlined"
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
                <MetricBadge
                  label="Out"
                  value={step.usage.tokensOut}
                  unit=" tokens"
                  color="primary"
                />
              )}
              {/* Tokens de entrada (input) - só mostra se não tiver tokensOut */}
              {step.usage?.tokensIn !== undefined && step.usage.tokensIn > 0 && !step.usage?.tokensOut && (
                <MetricBadge
                  label="In"
                  value={step.usage.tokensIn}
                  unit=" tokens"
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
