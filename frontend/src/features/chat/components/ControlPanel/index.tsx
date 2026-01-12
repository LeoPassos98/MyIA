// frontend/src/features/chat/components/ControlPanel/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Typography, Tabs, Tab, alpha, useTheme } from '@mui/material';
import { 
  Tune as TuneIcon, 
  Message as MessageIcon,
  SmartToy as BotIcon,
  PushPin as PushPinIcon,
  AccountTree as PipelineIcon
} from '@mui/icons-material';
import { useControlPanelLogic } from './useControlPanelLogic';
import { ModelTab } from './ModelTab';
import { ManualContextTab } from './ManualContextTab';
import { PinnedMessagesTab } from './PinnedMessagesTab';
import { ContextConfigTab } from './ContextConfigTab';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';

export default function ControlPanel() {
  const theme = useTheme();
  const { currentEditorTab, handleTabChange, chatHistorySnapshot } = useControlPanelLogic();

  // Conta mensagens pinadas para badge
  const pinnedCount = chatHistorySnapshot.filter(msg => msg.isPinned).length;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', color: 'text.primary' }}>
      
      {/* Header Fixo */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
          <TuneIcon /> Painel de Controle
        </Typography>
      </Box>

      {/* Tabs - 4 abas organizadas */}
      <Tabs
        value={currentEditorTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 600, minWidth: 0, py: 1.5 },
          '& .Mui-selected': { color: 'secondary.main' },
          '& .MuiTabs-indicator': { backgroundColor: theme.palette.secondary.main },
        }}
      >
        <Tab icon={<BotIcon fontSize="small" />} label="Modelo" />
        <Tab icon={<PipelineIcon fontSize="small" />} label="Contexto" />
        <Tab icon={<MessageIcon fontSize="small" />} label="Manual" />
        <Tab 
          icon={<PushPinIcon fontSize="small" />} 
          label={pinnedCount > 0 ? `${pinnedCount}` : "Fixadas"} 
        />
      </Tabs>

      {/* Conteúdo com Scroll */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, ...scrollbarStyles }}>
        {currentEditorTab === 0 && <ModelTab />}
        {currentEditorTab === 1 && <ContextConfigTab />}
        {currentEditorTab === 2 && <ManualContextTab />}
        {currentEditorTab === 3 && <PinnedMessagesTab />}
      </Box>

    </Box>
  );
}
