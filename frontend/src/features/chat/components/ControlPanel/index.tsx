import { Box, Typography, Tabs, Tab, alpha, useTheme } from '@mui/material';
import { Tune as TuneIcon, Settings as SettingsIcon, Message as MessageIcon } from '@mui/icons-material';
import { useControlPanelLogic } from './useControlPanelLogic';
import { ParametersTab } from './ParametersTab';
import { ManualContextTab } from './ManualContextTab';

export default function ControlPanel() {
  const theme = useTheme();
  const { currentEditorTab, handleTabChange } = useControlPanelLogic();

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
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 600 },
          '& .Mui-selected': { color: 'primary.main' }
        }}
      >
        <Tab icon={<SettingsIcon fontSize="small" />} label="Ajustes" />
        <Tab icon={<MessageIcon fontSize="small" />} label="Contexto" />
      </Tabs>

      {/* Conteúdo com Scroll */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {currentEditorTab === 0 && <ParametersTab />}
        {currentEditorTab === 1 && <ManualContextTab />}
      </Box>

    </Box>
  );
}
