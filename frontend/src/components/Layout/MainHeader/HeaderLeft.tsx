// frontend/src/components/Layout/MainHeader/HeaderLeft.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Fade, Tooltip, IconButton } from '@mui/material';
import { Menu as MenuIcon, History as HistoryIcon } from '@mui/icons-material';
import React from 'react';

interface HeaderLeftProps {
  isChatPage: boolean;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  isEditorOpen: boolean;
  slots: any;
  theme: any;
}

const HeaderLeft: React.FC<HeaderLeftProps> = ({ isChatPage, isHistoryOpen, setIsHistoryOpen, slots, theme, isEditorOpen }) => (
  <Box sx={{ width: 48, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
    {isChatPage ? (
      <Fade in={isChatPage}>
        <Tooltip title="History" arrow>
          <span>
            <IconButton
              size="medium"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              disabled={isEditorOpen && !isHistoryOpen}
              sx={{
                color: isHistoryOpen ? 'primary.main' : 'text.secondary',
                background: isHistoryOpen ? theme.palette.gradients.primary : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  color: 'primary.main',
                  background: theme.palette.gradients.primary,
                  opacity: 0.9,
                },
              }}
            >
              {isHistoryOpen ? <HistoryIcon /> : <MenuIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Fade>
    ) : (
      slots.left ? <Box sx={{ display: 'flex' }}>{slots.left}</Box> : null
    )}
  </Box>
);

export default HeaderLeft;
