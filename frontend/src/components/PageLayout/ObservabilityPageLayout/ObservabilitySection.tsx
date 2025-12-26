import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { HEADER_HEIGHT } from '@/components/Layout/layoutConstants';
import type { ObservabilitySectionProps } from './types';

/**
 * Wrapper para seções do layout de observabilidade
 */
export function ObservabilitySection({
  id,
  title,
  children,
  scrollMarginTop = HEADER_HEIGHT,
}: ObservabilitySectionProps) {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        scrollMarginTop,
        py: 3,
      }}
      aria-labelledby={`${id}-heading`}
    >
      <Typography
        id={`${id}-heading`}
        variant="h6"
        component="h2"
        sx={{ mb: 2, fontWeight: 600 }}
      >
        {title}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
}
