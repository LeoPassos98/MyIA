import { Box, Typography, Tabs, Tab, alpha, useTheme } from '@mui/material';
import { 
  Tune as TuneIcon, 
  Settings as SettingsIcon, 
  Message as MessageIcon,
  SmartToy as BotIcon,
  PushPin as PushPinIcon,
  AccountTree as PipelineIcon
} from '@mui/icons-material';
import { useControlPanelLogic } from './useControlPanelLogic';
import { ParametersTab } from './ParametersTab';
import { ManualContextTab } from './ManualContextTab';
import { ModelSelectionTab } from './ModelSelectionTab';
import { PinnedMessagesTab } from './PinnedMessagesTab';
import { ContextConfigTab } from './ContextConfigTab';

export default function ControlPanel() {
  const theme = useTheme();
  const { currentEditorTab, handleTabChange, chatHistorySnapshot } = useControlPanelLogic();

  // Conta mensagens pinadas para badge
  const pinnedCount = chatHistorySnapshot.filter(msg => msg.isPinned).length;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', color: 'text.primary' }}>
      
      {/* Header Fixo */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
          <TuneIcon /> Painel de Controle
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={currentEditorTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 600, minWidth: 0, px: 1.5 },
          '& .Mui-selected': { color: 'primary.main' }
        }}
      >
        <Tab icon={<BotIcon fontSize="small" />} label="IA" />
        <Tab icon={<SettingsIcon fontSize="small" />} label="Ajustes" />
        <Tab icon={<PipelineIcon fontSize="small" />} label="Contexto" />
        <Tab icon={<MessageIcon fontSize="small" />} label="Manual" />
        <Tab 
          icon={<PushPinIcon fontSize="small" />} 
          label={pinnedCount > 0 ? `📌 ${pinnedCount}` : "Fixadas"} 
        />
      </Tabs>

      {/* Conteúdo com Scroll */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {currentEditorTab === 0 && <ModelSelectionTab />}
        {currentEditorTab === 1 && <ParametersTab />}
        {currentEditorTab === 2 && <ContextConfigTab />}
        {currentEditorTab === 3 && <ManualContextTab />}
        {currentEditorTab === 4 && <PinnedMessagesTab />}
      </Box>

    </Box>
  );
}
