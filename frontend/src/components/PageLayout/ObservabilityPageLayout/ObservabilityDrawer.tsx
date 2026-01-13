// frontend/src/components/PageLayout/ObservabilityPageLayout/ObservabilityDrawer.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import type { ObservabilityDrawerProps } from './types';

/**
 * Drawer de navegação para mobile
 */
export function ObservabilityDrawer({
  sections,
  activeSectionId,
  onSectionClick,
  open,
  onClose,
}: ObservabilityDrawerProps) {
  const handleSectionClick = (sectionId: string) => {
    onSectionClick(sectionId);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        display: { xs: 'block', lg: 'none' },
        '& .MuiDrawer-paper': {
          width: 280,
        },
      }}
    >
      {/* Header do Drawer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Navegação
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Fechar menu"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Lista de seções */}
      <List sx={{ px: 1, py: 2 }}>
        {sections.map((section) => {
          const isActive = activeSectionId === section.id;
          return (
            <ListItemButton
              key={section.id}
              selected={isActive}
              onClick={() => handleSectionClick(section.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                  },
                },
              }}
            >
              {section.icon && (
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {section.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={section.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
