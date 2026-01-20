// frontend/src/features/chat/components/ControlPanel/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// Otimização Fase 2: Layout Optimization - CSS transforms para animações GPU-accelerated

import { Box, Typography, Tabs, Tab, alpha, useTheme } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import MessageIcon from '@mui/icons-material/Message';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PushPinIcon from '@mui/icons-material/PushPin';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
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
    <Box sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      color: 'text.primary',
      // Otimização Fase 2: Isolar subtree para evitar reflows externos
      contain: 'layout style paint',
    }}>
      
      {/* Header Fixo */}
      <Box sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        // Otimização Fase 2: GPU acceleration para backdrop
        willChange: 'auto',
      }}>
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
          '& .MuiTab-root': {
            fontWeight: 600,
            minWidth: 0,
            py: 1.5,
            // Otimização Fase 2: Transições suaves com transform
            transition: 'color 0.2s ease, transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
          },
          '& .Mui-selected': {
            color: 'secondary.main',
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.secondary.main,
            // Otimização Fase 2: Animação GPU-accelerated
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      >
        <Tab icon={<SmartToyIcon fontSize="small" />} label="Modelo" />
        <Tab icon={<AccountTreeIcon fontSize="small" />} label="Contexto" />
        <Tab icon={<MessageIcon fontSize="small" />} label="Manual" />
        <Tab
          icon={<PushPinIcon fontSize="small" />}
          label={pinnedCount > 0 ? `${pinnedCount}` : "Fixadas"}
        />
      </Tabs>

      {/* Conteúdo com Scroll */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        ...scrollbarStyles,
        // Otimização Fase 2: Fade in suave ao trocar tabs
        animation: 'fadeIn 0.2s ease-in',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}>
        {currentEditorTab === 0 && <ModelTab />}
        {currentEditorTab === 1 && <ContextConfigTab />}
        {currentEditorTab === 2 && <ManualContextTab />}
        {currentEditorTab === 3 && <PinnedMessagesTab />}
      </Box>

    </Box>
  );
}
