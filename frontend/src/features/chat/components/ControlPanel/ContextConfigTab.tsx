// frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  Box, Typography, Switch, FormControlLabel, Slider, TextField,
  Divider, Chip, alpha, useTheme, Tooltip, IconButton, Alert
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import PushPinIcon from '@mui/icons-material/PushPin';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import TokenIcon from '@mui/icons-material/Token';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningIcon from '@mui/icons-material/Warning';
import { PanelSection } from './PanelSection';
import { HelpTooltip } from './HelpTooltip';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useModelCapabilities } from '../../../../hooks/useModelCapabilities';

const DEFAULT_CONFIG = {
  systemPrompt: 'Você é uma IA útil e direta.',
  useCustomSystemPrompt: false,
  pinnedEnabled: true,
  recentEnabled: true,
  recentCount: 10,
  ragEnabled: true,
  ragTopK: 5,
  maxContextTokens: 6000,
};

export const ContextConfigTab = () => {
  const theme = useTheme();
  const { contextConfig, updateContextConfig, chatHistorySnapshot, manualContext, chatConfig } = useLayout();

  // Hook de capabilities do modelo selecionado
  const { capabilities } = useModelCapabilities(
    chatConfig.provider,
    chatConfig.model
  );

  // Modo manual ativo desabilita as opções de pipeline automático
  const isManualMode = manualContext.hasAdditionalContext;

  // Estatísticas
  const pinnedCount = chatHistorySnapshot.filter(msg => msg.isPinned).length;
  const totalMessages = chatHistorySnapshot.length;

  const handleReset = () => {
    console.log('🔄 [ContextConfigTab] Reset to defaults:', {
      from: contextConfig,
      to: DEFAULT_CONFIG
    });
    updateContextConfig(DEFAULT_CONFIG);
  };

  return (
    <Box sx={{ px: 2 }}>
      {/* Aviso de Modo Manual Ativo */}
      {isManualMode && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mb: 2 }}
        >
          <strong>Modo Manual ativo!</strong> As opções abaixo estão desabilitadas. 
          Desative o modo manual na aba "Manual" para usar o pipeline automático.
        </Alert>
      )}

      {/* Header com Reset */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon color="secondary" /> Pipeline de Contexto
        </Typography>
        <Tooltip title="Restaurar padrões">
          <span>
            <IconButton size="small" onClick={handleReset} disabled={isManualMode}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Configure como o contexto é construído e enviado para a IA.
        A ordem de prioridade é: System → Pinned → Recentes → RAG
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* 1. System Prompt */}
      <PanelSection active={contextConfig.useCustomSystemPrompt}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon fontSize="small" color="info" /> System Prompt
            <HelpTooltip 
              title="System Prompt (Instruções Iniciais)"
              description="Texto enviado no início de cada conversa que define a personalidade e comportamento da IA. É invisível para o usuário mas guia todas as respostas."
              examples={['Você é um assistente técnico...', 'Responda sempre em português...', 'Seja direto e conciso...']}
            />
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={contextConfig.useCustomSystemPrompt}
                onChange={(e) => {
                  console.log('🧠 [ContextConfigTab] System Prompt toggle:', {
                    enabled: e.target.checked,
                    promptLength: contextConfig.systemPrompt.length
                  });
                  updateContextConfig({ useCustomSystemPrompt: e.target.checked });
                }}
                size="small"
                color="info"
              />
            }
            label={<Typography variant="caption">Personalizado</Typography>}
            labelPlacement="start"
          />
        </Box>
        <TextField
          multiline
          rows={3}
          placeholder="Instruções para a IA..."
          value={contextConfig.systemPrompt}
          onChange={(e) => updateContextConfig({ systemPrompt: e.target.value })}
          disabled={!contextConfig.useCustomSystemPrompt}
          variant="outlined"
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha(theme.palette.background.default, 0.5),
            }
          }}
        />
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* 2. Mensagens Pinadas */}
      <PanelSection active={contextConfig.pinnedEnabled && !isManualMode} disabled={isManualMode}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isManualMode ? 0.5 : 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PushPinIcon fontSize="small" color={isManualMode ? 'disabled' : 'warning'} />
            <Typography variant="subtitle2" fontWeight="bold">Mensagens Fixadas</Typography>
            <HelpTooltip 
              title="Mensagens Fixadas (Pinned)"
              description="Mensagens que você fixou com o ícone 📌 no chat. São SEMPRE enviadas para a IA com prioridade máxima, independente do limite de tokens."
              examples={['Fixar instruções importantes', 'Manter contexto de projeto', 'Preservar decisões tomadas']}
            />
            <Chip 
              label={`${pinnedCount} pinned`} 
              size="small" 
              color={pinnedCount > 0 && !isManualMode ? 'warning' : 'default'}
              variant="outlined"
            />
          </Box>
          <Switch
            checked={contextConfig.pinnedEnabled}
            onChange={(e) => {
              console.log('📌 [ContextConfigTab] Pinned messages toggle:', {
                enabled: e.target.checked,
                pinnedCount,
                isManualMode
              });
              updateContextConfig({ pinnedEnabled: e.target.checked });
            }}
            size="small"
            color="warning"
            disabled={isManualMode}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Sempre incluídas no contexto com prioridade máxima.
        </Typography>
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* 3. Mensagens Recentes */}
      <PanelSection active={contextConfig.recentEnabled && !isManualMode} disabled={isManualMode}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, opacity: isManualMode ? 0.5 : 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon fontSize="small" color={isManualMode ? 'disabled' : 'success'} />
            <Typography variant="subtitle2" fontWeight="bold">Memória Recente</Typography>
            <HelpTooltip 
              title="Memória Recente (Fast Memory)"
              description="As últimas N mensagens da conversa são sempre incluídas. Isso mantém o contexto imediato da conversa para a IA entender o fluxo."
              examples={['5 msgs: Conversação curta', '10 msgs: Contexto médio', '25 msgs: Conversa longa']}
            />
            <Chip 
              label={`${Math.min(contextConfig.recentCount, totalMessages)}/${totalMessages}`} 
              size="small" 
              color={isManualMode ? 'default' : 'success'}
              variant="outlined"
            />
          </Box>
          <Switch
            checked={contextConfig.recentEnabled}
            onChange={(e) => {
              console.log('📜 [ContextConfigTab] Recent messages toggle:', {
                enabled: e.target.checked,
                recentCount: contextConfig.recentCount,
                totalMessages,
                isManualMode
              });
              updateContextConfig({ recentEnabled: e.target.checked });
            }}
            size="small"
            color="success"
            disabled={isManualMode}
          />
        </Box>
        
        <Box sx={{ px: 1, opacity: isManualMode ? 0.5 : 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Últimas mensagens: {contextConfig.recentCount}
          </Typography>
          <Slider
            value={contextConfig.recentCount}
            onChange={(_, value) => {
              console.log('📊 [ContextConfigTab] Recent count changed:', {
                from: contextConfig.recentCount,
                to: value,
                totalMessages
              });
              updateContextConfig({ recentCount: value as number });
            }}
            disabled={!contextConfig.recentEnabled || isManualMode}
            min={1}
            max={50}
            marks={[
              { value: 1, label: '1' },
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ]}
            valueLabelDisplay="auto"
            color="success"
            size="small"
          />
        </Box>
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* 4. RAG (Busca Semântica) */}
      <PanelSection active={contextConfig.ragEnabled && !isManualMode} disabled={isManualMode}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, opacity: isManualMode ? 0.5 : 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon fontSize="small" color={isManualMode ? 'disabled' : 'secondary'} />
            <Typography variant="subtitle2" fontWeight="bold">RAG (Busca Semântica)</Typography>
            <HelpTooltip 
              title="RAG - Retrieval Augmented Generation"
              description="Busca mensagens antigas que são semanticamente similares à sua pergunta atual, mesmo que não usem as mesmas palavras. Usa embeddings vetoriais para encontrar contexto relevante."
              examples={['Pergunta sobre React → encontra msgs antigas sobre React', 'Top 3: Rápido, menos contexto', 'Top 10: Mais contexto, mais tokens']}
            />
          </Box>
          <Switch
            checked={contextConfig.ragEnabled}
            onChange={(e) => {
              console.log('🔍 [ContextConfigTab] RAG toggle:', {
                enabled: e.target.checked,
                ragTopK: contextConfig.ragTopK,
                isManualMode
              });
              updateContextConfig({ ragEnabled: e.target.checked });
            }}
            size="small"
            color="secondary"
            disabled={isManualMode}
          />
        </Box>
        
        <Box sx={{ px: 1, opacity: isManualMode ? 0.5 : 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Mensagens similares a buscar: {contextConfig.ragTopK}
          </Typography>
          <Slider
            value={contextConfig.ragTopK}
            onChange={(_, value) => {
              console.log('📊 [ContextConfigTab] RAG topK changed:', {
                from: contextConfig.ragTopK,
                to: value
              });
              updateContextConfig({ ragTopK: value as number });
            }}
            disabled={!contextConfig.ragEnabled || isManualMode}
            min={1}
            max={20}
            marks={[
              { value: 1, label: '1' },
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
            ]}
            valueLabelDisplay="auto"
            color="secondary"
            size="small"
          />
        </Box>
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* 5. Limite de Tokens */}
      <PanelSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TokenIcon fontSize="small" color="error" />
          <Typography variant="subtitle2" fontWeight="bold">Budget de Tokens</Typography>
          <HelpTooltip 
            title="Limite de Tokens do Contexto"
            description="Tokens são pedaços de palavras (~4 caracteres). Este limite define quanto do histórico pode ser enviado. Mensagens fixadas TÊM prioridade e podem exceder este limite."
            examples={['2K: Contexto curto, respostas rápidas', '4K: Equilíbrio (recomendado Groq)', '8K: Contexto extenso, mais lento']}
          />
          <Chip 
            label={`${contextConfig.maxContextTokens.toLocaleString()} max`} 
            size="small" 
            color="error"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Limite máximo de tokens para o contexto
          </Typography>
          <Slider
            value={contextConfig.maxContextTokens}
            onChange={(_, value) => {
              const maxWindow = capabilities?.maxContextWindow ?? 8000;
              console.log('🎯 [ContextConfigTab] Max context tokens changed:', {
                from: contextConfig.maxContextTokens,
                to: value,
                percentage: ((value as number) / maxWindow * 100).toFixed(0) + '%',
                modelMaxWindow: maxWindow
              });
              updateContextConfig({ maxContextTokens: value as number });
            }}
            min={1000}
            max={capabilities?.maxContextWindow ?? 8000}
            step={1000}
            marks={[
              { value: 1000, label: '1K' },
              { value: capabilities?.maxContextWindow ?? 8000, label: `${((capabilities?.maxContextWindow ?? 8000) / 1000).toFixed(0)}K` }
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${(v / 1000).toFixed(1)}K`}
            color="error"
            size="small"
          />
          
          {/* Aviso dinâmico baseado em capabilities */}
          {capabilities && contextConfig.maxContextTokens > capabilities.maxContextWindow && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              ⚠️ O limite configurado ({contextConfig.maxContextTokens.toLocaleString()} tokens)
              excede a capacidade do modelo ({capabilities.maxContextWindow.toLocaleString()} tokens).
              O modelo usará no máximo {capabilities.maxContextWindow.toLocaleString()} tokens.
            </Alert>
          )}
        </Box>
      </PanelSection>

      {/* Preview do Pipeline */}
      <Box sx={{ 
        mt: 3, 
        p: 2, 
        bgcolor: alpha(isManualMode ? theme.palette.warning.main : theme.palette.secondary.main, 0.05), 
        borderRadius: 2,
        border: '1px dashed',
        borderColor: isManualMode ? 'warning.main' : 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Typography variant="caption" fontWeight="bold" color={isManualMode ? 'warning.main' : 'secondary.main'}>
            {isManualMode ? '⚠️ Modo Manual Ativo' : '📋 Ordem do Pipeline Ativo:'}
          </Typography>
          {!isManualMode && (
            <HelpTooltip
              title="Ordem do Pipeline Ativo"
              description="Ordem de prioridade e construção do contexto enviado para a IA. Cada etapa é adicionada sequencialmente até atingir o limite de tokens."
              examples={[
                "1. System: Prompt inicial (sempre primeiro)",
                "2. Pinned: Mensagens fixadas (prioridade máxima)",
                "3. Recentes: Últimas N mensagens (memória recente)",
                "4. RAG: Mensagens semanticamente relevantes (busca inteligente)"
              ]}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {isManualMode ? (
            <Chip label="Seleção Manual" size="small" color="warning" variant="filled" />
          ) : (
            <>
              <Chip label="1. System" size="small" color="info" variant="filled" />
              {contextConfig.pinnedEnabled && (
                <Chip label={`2. Pinned (${pinnedCount})`} size="small" color="warning" variant="filled" />
              )}
              {contextConfig.recentEnabled && (
                <Chip label={`3. Recentes (${contextConfig.recentCount})`} size="small" color="success" variant="filled" />
              )}
              {contextConfig.ragEnabled && (
                <Chip label={`4. RAG (top ${contextConfig.ragTopK})`} size="small" color="secondary" variant="filled" />
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};
