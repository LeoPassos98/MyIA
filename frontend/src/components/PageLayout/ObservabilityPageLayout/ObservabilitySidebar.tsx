import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { ObservabilitySidebarProps } from './types';
import { scrollbarStyles } from '@/theme/scrollbarStyles';

/**
 * Sidebar fixa para navegação entre seções (desktop)
 */
export function ObservabilitySidebar({
  sections,
  activeSectionId,
  onSectionClick,
}: ObservabilitySidebarProps) {
  return (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        width: 220,
        flexShrink: 0,
        position: 'sticky',
        top: 96,
        height: 'fit-content',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        ...scrollbarStyles,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          px: 2,
          py: 1,
          color: 'text.secondary',
          fontWeight: 600,
        }}
      >
        Navegação
      </Typography>
      <List disablePadding>
        {sections.map((section) => {
          const isActive = activeSectionId === section.id;
          return (
            <ListItemButton
              key={section.id}
              selected={isActive}
              onClick={() => onSectionClick(section.id)}
              sx={{
                borderRadius: 1,
                mx: 1,
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
    </Box>
  );
}
