// frontend/src/components/Layout/MainHeader/HeaderRight.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Fade, Tooltip, IconButton } from '@mui/material';
import { Tune as TuneIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import React from 'react';

interface HeaderRightProps {
  isChatPage: boolean;
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  isHistoryOpen: boolean;
  slots: any;
  theme: any;
}

const HeaderRight: React.FC<HeaderRightProps> = ({ isChatPage, isEditorOpen, setIsEditorOpen, slots, theme, isHistoryOpen }) => (
  <Box sx={{ width: 48, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
    {isChatPage ? (
      <Fade in={isChatPage}>
        <Tooltip title="Panel" arrow>
          <span>
            <IconButton
              size="medium"
              onClick={() => setIsEditorOpen(!isEditorOpen)}
              disabled={isHistoryOpen && !isEditorOpen}
              sx={{
                color: isEditorOpen ? 'secondary.main' : 'text.secondary',
                background: isEditorOpen ? theme.palette.gradients.secondary : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  color: 'secondary.main',
                  background: theme.palette.gradients.secondary,
                  opacity: 0.9,
                },
              }}
            >
              {isEditorOpen ? <DashboardIcon /> : <TuneIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Fade>
    ) : (
      slots.right ? <Box sx={{ display: 'flex' }}>{slots.right}</Box> : null
    )}
  </Box>
);

export default HeaderRight;
