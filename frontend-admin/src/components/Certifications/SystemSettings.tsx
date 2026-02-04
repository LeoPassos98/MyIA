// frontend-admin/src/components/Certifications/SystemSettings.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Link
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

export function SystemSettings() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Links Úteis
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="Bull Board"
              secondary={
                <Link
                  href="http://localhost:3001/admin/queues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:3001/admin/queues
                </Link>
              }
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <StorageIcon />
            </ListItemIcon>
            <ListItemText
              primary="Prisma Studio"
              secondary={
                <Link
                  href="http://localhost:5555"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:5555
                </Link>
              }
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <HealthAndSafetyIcon />
            </ListItemIcon>
            <ListItemText
              primary="Worker Health Check"
              secondary={
                <Link
                  href="http://localhost:3004/health"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:3004/health
                </Link>
              }
            />
          </ListItem>
        </List>

        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Configurações do Sistema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Concorrência: 3 jobs simultâneos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Timeout: 5 minutos por job
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Retry: 3 tentativas automáticas
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
