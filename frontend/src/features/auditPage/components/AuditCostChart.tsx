// frontend/src/features/auditPage/components/AuditCostChart.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Paper, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CostTimelinePoint } from '../hooks/useAuditCostTimeline';

interface AuditCostChartProps {
  data: CostTimelinePoint[];
}

export function AuditCostChart({ data }: AuditCostChartProps) {
  const theme = useTheme();

  if (data.length === 0) {
    return null;
  }

  const formatCost = (value: number) => {
    return `$${value.toFixed(6)}`;
  };

  const formatDate = (dateString: string) => {
    const [, month, day] = dateString.split('-');
    return `${day}/${month}`;
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        minHeight: 400,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Custos ao Longo do Tempo
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
        Soma diária de custos de inferências
      </Typography>

      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke={theme.palette.text.secondary}
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis
              tickFormatter={formatCost}
              stroke={theme.palette.text.secondary}
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip
              formatter={(value: number | undefined) => [value ? formatCost(value) : '$0.000000', 'Custo']}
              labelFormatter={(label: string) => `Data: ${formatDate(label)}`}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                color: theme.palette.text.primary,
              }}
            />
            <Line
              type="monotone"
              dataKey="cost"
              stroke={theme.palette.text.primary}
              strokeWidth={2}
              dot={{ fill: theme.palette.background.paper, stroke: theme.palette.text.primary }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
