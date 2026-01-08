// frontend/src/features/promptTrace/components/PromptTraceViewer.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import type { PromptTraceRecord } from '../types';
import { PromptTraceHeader } from './PromptTraceHeader';
import { PromptTraceTimeline } from './PromptTraceTimeline';
import { PromptTraceStepDetails } from './PromptTraceStepDetails';
import { PromptTraceUsageSummary } from './PromptTraceUsageSummary';

interface Props {
  trace: PromptTraceRecord;
}

/**
 * Container principal do Prompt Trace Viewer
 */
export function PromptTraceViewer({ trace }: Props) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    trace.steps[0]?.stepId ?? null
  );

  const selectedStep = trace.steps.find((s) => s.stepId === selectedStepId);

  // Só mostra timestamp por step se houver diferença relevante
  const allSameTimestamp = useMemo(() => {
    return (
      trace.steps.length > 0 &&
      trace.steps.every((s) => s.timestamp === trace.steps[0].timestamp)
    );
  }, [trace.steps]);

  const responseMessage = useMemo(() => {
    return trace.steps.find((s) => s.stepId.startsWith('res-')) ?? null;
  }, [trace.steps]);

  const configEntries = useMemo(() => {
    const rawConfig = trace.metadata?.rawConfig as any | undefined;
    const pinnedCount = trace.metadata?.pinnedMessagesCount ?? 0;

    return [
      { label: 'Provider', value: trace.modelInfo.provider },
      { label: 'Model', value: trace.modelInfo.model },
      { label: 'Mode', value: rawConfig?.mode ?? '—' },
      { label: 'Strategy', value: trace.metadata?.strategy ?? '—' },
      { label: 'Temperature', value: trace.modelInfo.temperature ?? '—' },
      { label: 'TopK', value: rawConfig?.params?.topK ?? '—' },
      { label: 'Memory Window', value: trace.metadata?.contextWindowSize ?? '—' },
      { label: '📌 Pinned', value: pinnedCount > 0 ? `${pinnedCount} msg` : '—' },
    ];
  }, [trace]);

  const infoEntries = useMemo(() => {
    // Status com formatação especial
    const statusDisplay = trace.status === 'error' 
      ? '❌ error' 
      : trace.status === 'timeout' 
        ? '⏱️ timeout' 
        : '✅ success';
    
    return [
      { label: 'Status', value: statusDisplay, isError: trace.status === 'error' },
      { label: 'Provider / Model', value: `${trace.modelInfo.provider} / ${trace.modelInfo.model}` },
      { label: 'Total Steps', value: trace.steps.length },

      { label: 'Trace ID', value: trace.traceId },
      { label: 'Chat ID', value: trace.chatId },
      { label: 'Message ID', value: trace.messageId },
      { label: 'Timestamp', value: new Date(trace.timestamp).toLocaleString('pt-BR') },
    ];
  }, [trace]);

  return (
    <Box>
      {/* Header */}
      <PromptTraceHeader trace={trace} />

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Config */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Config
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1}>
              {configEntries.map((item) => (
                <Box
                  key={item.label}
                  sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', textAlign: 'right' }}
                  >
                    {String(item.value)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Info */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Info
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.25}>
              {infoEntries.map((item) => (
                <Box key={item.label}>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ 
                      fontFamily: 'monospace', 
                      display: 'block',
                      color: (item as any).isError ? 'error.main' : 'text.primary',
                      fontWeight: (item as any).isError ? 600 : 400,
                    }}
                  >
                    {String(item.value)}
                  </Typography>
                </Box>
              ))}
              
              {/* Mensagem de erro detalhada */}
              {trace.errorMessage && (
                <Box sx={{ 
                  mt: 1, 
                  p: 1.5, 
                  bgcolor: 'error.dark', 
                  borderRadius: 1,
                    border: '1px solid',
                  borderColor: 'error.main',
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'error.contrastText',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {trace.errorMessage}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Response */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Response
              </Typography>

              {responseMessage ? (
                <Chip size="small" variant="outlined" label="assistant" />
              ) : (
                <Chip size="small" variant="outlined" label="empty" />
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {responseMessage ? (
              <Box
                sx={{
                    border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  maxHeight: 240,
                  overflow: 'auto',
                  bgcolor: 'background.default',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                  }}
                >
                  {responseMessage.content}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhuma resposta registrada.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Uso Total */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Uso Total
        </Typography>
        <PromptTraceUsageSummary usage={trace.totalUsage} />
      </Box>

      {/* Timeline + Detalhes */}
      <Grid container spacing={3}>
        {/* Timeline */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <PromptTraceTimeline
              steps={trace.steps}
              selectedStepId={selectedStepId}
              onStepSelect={setSelectedStepId}
            />
          </Paper>
        </Grid>

        {/* Detalhes do Step */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            {selectedStep ? (
              <PromptTraceStepDetails
                step={selectedStep}
                showTimestamp={!allSameTimestamp}
              />
            ) : (
              <Typography color="text.secondary" textAlign="center">
                Selecione um step para ver detalhes
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
