/**
 * frontend/src/features/settings/components/ModelsManagement/components/ModelsTable.tsx
 * Table component for displaying models list
 * Standards: docs/STANDARDS.md §3.0, §15
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Alert,
} from '@mui/material';
import { ModelTableRow } from './ModelTableRow';
import type { ModelWithProvider } from '../types';

interface ModelsTableProps {
  models: ModelWithProvider[];
  certifiedModels: string[];
  selectedModels: string[];
  isCertifying: string | null;
  onToggleModel: (modelId: string) => void;
  onCertifyModel: (modelId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

/**
 * Tabela de modelos com cabeçalho e linhas
 */
export function ModelsTable({
  models,
  certifiedModels,
  selectedModels,
  isCertifying,
  onToggleModel,
  onCertifyModel,
  onSelectAll,
  onDeselectAll,
}: ModelsTableProps) {
  if (models.length === 0) {
    return (
      <Alert severity="info">
        Nenhum modelo encontrado para o filtro selecionado.
      </Alert>
    );
  }

  const allSelected = selectedModels.length === models.length && models.length > 0;
  const someSelected = selectedModels.length > 0 && selectedModels.length < models.length;

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => (e.target.checked ? onSelectAll() : onDeselectAll())}
              />
            </TableCell>
            <TableCell>
              <strong>Modelo</strong>
            </TableCell>
            <TableCell>
              <strong>Vendor</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Status</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Rating</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Context Window</strong>
            </TableCell>
            <TableCell align="right">
              <strong>Ações</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {models.map((model) => (
            <ModelTableRow
              key={model.id}
              model={model}
              isCertified={certifiedModels.includes(model.apiModelId)}
              isSelected={selectedModels.includes(model.apiModelId)}
              isCertifying={isCertifying === model.apiModelId}
              onToggle={onToggleModel}
              onCertify={onCertifyModel}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
