/**
 * frontend/src/features/settings/components/ModelsManagement/components/ModelsToolbar.tsx
 * Toolbar with filters and bulk actions for models management
 * Standards: docs/STANDARDS.md §3.0, §15
 */

import {
  Box,
  Button,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { FilterType } from '../hooks';

interface ModelsToolbarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  filterCounts: {
    all: number;
    certified: number;
    untested: number;
  };
  selectedCount: number;
  uncertifiedSelectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCertifySelected: () => void;
  onRefresh: () => void;
  isCertifyingBatch: boolean;
}

/**
 * Barra de ferramentas com filtros e ações em lote
 */
export function ModelsToolbar({
  filter,
  onFilterChange,
  filterCounts,
  selectedCount,
  uncertifiedSelectedCount,
  onSelectAll,
  onDeselectAll,
  onCertifySelected,
  onRefresh,
  isCertifyingBatch,
}: ModelsToolbarProps) {
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Filtros */}
      <Button
        size="small"
        variant={filter === 'all' ? 'contained' : 'outlined'}
        onClick={() => onFilterChange('all')}
      >
        Todos ({filterCounts.all})
      </Button>
      <Button
        size="small"
        variant={filter === 'certified' ? 'contained' : 'outlined'}
        onClick={() => onFilterChange('certified')}
        startIcon={<CheckCircleIcon />}
      >
        Certificados ({filterCounts.certified})
      </Button>
      <Button
        size="small"
        variant={filter === 'untested' ? 'contained' : 'outlined'}
        onClick={() => onFilterChange('untested')}
      >
        Não Certificados ({filterCounts.untested})
      </Button>

      <Box sx={{ flexGrow: 1 }} />

      {/* Ações de seleção */}
      {selectedCount > 0 ? (
        <>
          <Typography variant="body2" color="text.secondary">
            {selectedCount} selecionado(s)
          </Typography>
          <Button size="small" variant="outlined" onClick={onDeselectAll}>
            Limpar
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={onCertifySelected}
            disabled={uncertifiedSelectedCount === 0 || isCertifyingBatch}
            startIcon={
              isCertifyingBatch ? <CircularProgress size={16} /> : <VerifiedUserIcon />
            }
          >
            {isCertifyingBatch
              ? 'Certificando...'
              : `Certificar ${uncertifiedSelectedCount} modelo(s)`}
          </Button>
          {selectedCount > uncertifiedSelectedCount && (
            <Typography variant="caption" color="text.secondary">
              ({selectedCount - uncertifiedSelectedCount} já certificado(s))
            </Typography>
          )}
        </>
      ) : (
        <Button size="small" variant="outlined" onClick={onSelectAll}>
          Selecionar Todos
        </Button>
      )}

      <Tooltip title="Recarregar dados" arrow>
        <IconButton onClick={onRefresh} size="small" color="primary">
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
