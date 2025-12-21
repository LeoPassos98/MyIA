// frontend/src/features/auditPage/components/AuditTable.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import { AuditTableRow } from '../types';

interface AuditTableProps {
  records: AuditTableRow[];
  onRowClick: (messageId: string) => void;
}

type OrderBy = 'timestamp' | 'cost' | 'tokens';
type Order = 'asc' | 'desc';

export function AuditTable({ records, onRowClick }: AuditTableProps) {
  // Estado local de ordenação (client-side)
  const [orderBy, setOrderBy] = useState<OrderBy>('timestamp');
  const [order, setOrder] = useState<Order>('desc');

  // Ordenação client-side (sem refetch)
  const sortedRecords = useMemo(() => {
    const sorted = [...records];
    
    sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (orderBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'cost':
          aValue = a.cost;
          bValue = b.cost;
          break;
        case 'tokens':
          aValue = a.totalTokens;
          bValue = b.totalTokens;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [records, orderBy, order]);

  const handleSort = (column: OrderBy) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  if (records.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Nenhum registro de auditoria encontrado
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'timestamp'}
                direction={order}
                onClick={() => handleSort('timestamp')}
              >
                Data/Hora
              </TableSortLabel>
            </TableCell>
            <TableCell>Provider</TableCell>
            <TableCell>Model</TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'tokens'}
                direction={order}
                onClick={() => handleSort('tokens')}
              >
                Tokens In
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">Tokens Out</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'cost'}
                direction={order}
                onClick={() => handleSort('cost')}
              >
                Custo
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRecords.map((row) => (
            <TableRow
              key={row.messageId}
              hover
              onClick={() => onRowClick(row.messageId)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {formatDate(row.timestamp)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={row.provider} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {row.model}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">{row.promptTokens.toLocaleString()}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">{row.completionTokens.toLocaleString()}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold">
                  {row.totalTokens.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="primary" fontWeight="bold">
                  {formatCost(row.cost)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
