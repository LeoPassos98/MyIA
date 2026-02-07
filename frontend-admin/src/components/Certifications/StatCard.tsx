// frontend-admin/src/components/Certifications/StatCard.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Grid, Card, CardContent, Typography, Tooltip } from '@mui/material';
import { HelpTooltip } from './HelpTooltip';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  emoji: string;
  color: 'warning' | 'info' | 'success' | 'error';
  tooltip: string;
  helpTitle: string;
  helpDescription: string;
}

export function StatCard({
  icon,
  value,
  label,
  emoji,
  color,
  tooltip,
  helpTitle,
  helpDescription
}: StatCardProps) {
  // Mapear cor para background do tema
  const backgroundMap = {
    warning: 'backgrounds.warningSubtle',
    info: 'backgrounds.infoSubtle',
    success: 'backgrounds.successSubtle',
    error: 'backgrounds.errorSubtle'
  };

  return (
    <Grid item xs={12} sm={6} md={3}>
      <Tooltip title={tooltip} arrow placement="top">
        <Card 
          sx={{ 
            cursor: 'help',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 3
            }
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={(theme) => ({
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: theme.palette[backgroundMap[color].split('.')[0] as 'backgrounds'][backgroundMap[color].split('.')[1] as 'warningSubtle'],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  })}
                >
                  {icon}
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    {value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {emoji} {label}
                  </Typography>
                </Box>
              </Box>
              <HelpTooltip
                title={helpTitle}
                description={helpDescription}
              />
            </Box>
          </CardContent>
        </Card>
      </Tooltip>
    </Grid>
  );
}
