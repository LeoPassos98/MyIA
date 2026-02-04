// frontend-admin/src/components/Certifications/JobFilters.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

interface JobFiltersProps {
  searchId: string;
  onSearchIdChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  filteredCount: number;
  showResultCount: boolean;
}

/**
 * Componente de filtros para a tabela de jobs
 * Extraído do JobHistoryTable para reduzir tamanho do arquivo
 */
export function JobFilters({
  searchId,
  onSearchIdChange,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
  showResultCount
}: JobFiltersProps) {
  return (
    <Box display="flex" gap={2} mb={3} flexWrap="wrap">
      <TextField
        size="small"
        placeholder="Buscar por ID do job..."
        value={searchId}
        onChange={(e) => onSearchIdChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          )
        }}
        sx={{ minWidth: 250 }}
      />
      
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Filtrar por Status</InputLabel>
        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          label="Filtrar por Status"
          startAdornment={
            <InputAdornment position="start">
              <FilterListIcon fontSize="small" />
            </InputAdornment>
          }
        >
          <MenuItem value="ALL">Todos</MenuItem>
          <MenuItem value="QUEUED">Na Fila</MenuItem>
          <MenuItem value="PROCESSING">Em Execução</MenuItem>
          <MenuItem value="COMPLETED">Completos</MenuItem>
          <MenuItem value="FAILED">Falhados</MenuItem>
        </Select>
      </FormControl>

      {showResultCount && (
        <Chip
          label={`${filteredCount} resultado${filteredCount !== 1 ? 's' : ''}`}
          color="primary"
          variant="outlined"
        />
      )}
    </Box>
  );
}
