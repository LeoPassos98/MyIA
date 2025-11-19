import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import { useLayout } from '../../contexts/LayoutContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`control-panel-tabpanel-${index}`}
      aria-labelledby={`control-panel-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ControlPanel() {
  const {
    currentEditorTab,
    setCurrentEditorTab,
    chatConfig,
    updateChatConfig,
    manualContext,
    setManualContext,
    toggleMessageSelection,
    chatHistorySnapshot,
  } = useLayout();

  // Não ativar automaticamente mais - usuário controla via Switch
  // useEffect removido - controle manual via Switch

  // Remover parâmetro não utilizado 'event' de handleTabChange
  const handleTabChange = (_: unknown, newValue: number) => {
    setCurrentEditorTab(newValue);
  };

  // Provider options
  const providerOptions = [
    { value: 'groq', label: 'Groq (LLaMA 3.1 - Gratuito)' },
    { value: 'openai', label: 'OpenAI (GPT-3.5/4)' },
    { value: 'claude', label: 'Claude (Anthropic)' },
    { value: 'together', label: 'Together.ai' },
    { value: 'perplexity', label: 'Perplexity' },
    { value: 'mistral', label: 'Mistral' },
  ];

  // Model options per provider (simplified)
  const modelOptions: Record<string, string[]> = {
    groq: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile'],
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    claude: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    together: ['meta-llama/Llama-3-70b-chat-hf'],
    perplexity: ['llama-3.1-sonar-small-128k-online'],
    mistral: ['mistral-large-latest', 'mistral-medium-latest'],
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={currentEditorTab}
        onChange={handleTabChange}
        aria-label="control panel tabs"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Ajustes" />
        <Tab label="Contexto Manual" />
      </Tabs>

      {/* TAB 0: AJUSTES */}
      <TabPanel value={currentEditorTab} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Provider Selection */}
          <FormControl fullWidth size="small">
            <InputLabel>Provider de IA</InputLabel>
            <Select
              value={chatConfig.provider}
              label="Provider de IA"
              onChange={(e) => updateChatConfig({ provider: e.target.value })}
            >
              {providerOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Model Selection */}
          <FormControl fullWidth size="small">
            <InputLabel>Modelo</InputLabel>
            <Select
              value={chatConfig.model}
              label="Modelo"
              onChange={(e) => updateChatConfig({ model: e.target.value })}
            >
              {(modelOptions[chatConfig.provider] || []).map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Strategy Selection */}
          <FormControl fullWidth size="small">
            <InputLabel>Estratégia de Contexto</InputLabel>
            <Select
              value={chatConfig.strategy}
              label="Estratégia de Contexto"
              onChange={(e) => updateChatConfig({ strategy: e.target.value as 'fast' | 'efficient' })}
            >
              <MenuItem value="fast">⚡ Rápido (Últimas 10 msgs)</MenuItem>
              <MenuItem value="efficient">🧠 Inteligente (RAG Híbrido)</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          {/* Temperature Slider */}
          <Box>
            <Typography variant="caption" gutterBottom>
              Temperatura: {chatConfig.temperature.toFixed(1)}
            </Typography>
            <Slider
              value={chatConfig.temperature}
              onChange={(_, value) => updateChatConfig({ temperature: value as number })}
              min={0}
              max={1}
              step={0.1}
              marks={[
                { value: 0, label: '0' },
                { value: 0.5, label: '0.5' },
                { value: 1, label: '1' },
              ]}
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              Menor = mais focado, Maior = mais criativo
            </Typography>
          </Box>

          {/* Memory Window Slider */}
          <Box>
            <Typography variant="caption" gutterBottom>
              Janela de Memória: {chatConfig.memoryWindow}
            </Typography>
            <Slider
              value={chatConfig.memoryWindow}
              onChange={(_, value) => updateChatConfig({ memoryWindow: value as number })}
              min={0}
              max={20}
              step={1}
              marks={[
                { value: 0, label: '0' },
                { value: 10, label: '10' },
                { value: 20, label: '20' },
              ]}
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              Número de mensagens anteriores consideradas
            </Typography>
          </Box>

          {/* TopK Slider (RAG) - Only enabled for 'efficient' strategy */}
          <Box>
            <Typography variant="caption" gutterBottom>
              TopK (RAG): {chatConfig.topK}
            </Typography>
            <Slider
              value={chatConfig.topK}
              onChange={(_, value) => updateChatConfig({ topK: value as number })}
              min={1}
              max={10}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
              ]}
              valueLabelDisplay="auto"
              disabled={chatConfig.strategy !== 'efficient'}
            />
            <Typography variant="caption" color="text.secondary">
              Profundidade de busca semântica (apenas em modo Inteligente)
            </Typography>
          </Box>
        </Box>
      </TabPanel>

      {/* TAB 1: CONTEXTO MANUAL */}
      <TabPanel value={currentEditorTab} index={1}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: 'calc(100vh - 200px)' }}>
          <Typography variant="h6" gutterBottom>
            Modo Manual
          </Typography>

          {/* Switch para Ativar/Desativar Modo Manual */}
          <FormControlLabel
            control={
              <Switch
                checked={manualContext.isActive}
                onChange={(e) => setManualContext({ 
                  ...manualContext, 
                  isActive: e.target.checked 
                })}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">
                  {manualContext.isActive ? '✅ Modo Manual Ativo' : '⚪ Modo Manual Desativado'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {manualContext.isActive 
                    ? 'O chat usará apenas o contexto definido abaixo' 
                    : 'O chat usará o modo automático (RAG)'}
                </Typography>
              </Box>
            }
          />

          <Divider />
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Selecione mensagens específicas para incluir no contexto:
          </Typography>

          {/* Message Selection List */}
          <Paper 
            variant="outlined" 
            sx={{ 
              flex: 1, 
              overflow: 'auto', 
              maxHeight: '300px',
              mb: 2 
            }}
          >
            <List dense>
              {chatHistorySnapshot.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="Nenhuma mensagem no histórico" 
                    secondary="Envie uma mensagem para começar"
                  />
                </ListItem>
              ) : (
                chatHistorySnapshot.map((msg) => (
                  <ListItemButton
                    key={msg.id}
                    onClick={() => toggleMessageSelection(msg.id)}
                    dense
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={manualContext.selectedMessageIds.includes(msg.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {msg.role === 'user' ? '👤 Você' : '🤖 IA'}: {msg.content.substring(0, 50)}...
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {new Date(msg.createdAt).toLocaleString('pt-BR')}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))
              )}
            </List>
          </Paper>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Contexto adicional (opcional):
          </Typography>

          {/* Additional Context Input */}
          <TextField
            multiline
            rows={6}
            placeholder="Digite informações adicionais de contexto aqui..."
            value={manualContext.additionalText}
            onChange={(e) => setManualContext({ ...manualContext, additionalText: e.target.value })}
            variant="outlined"
            fullWidth
          />

          <Typography variant="caption" color="text.secondary">
            💡 Mensagens selecionadas: {manualContext.selectedMessageIds.length}
          </Typography>
        </Box>
      </TabPanel>
    </Box>
  );
}