// frontend/src/features/chat/components/ControlPanel/RegionFilter.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * RegionFilter Component
 *
 * Componente de filtro de região AWS para certificações.
 * Permite selecionar uma região específica ou "Todas as regiões".
 *
 * @module features/chat/components/ControlPanel/RegionFilter
 */

import { FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent } from '@mui/material';
import { Public } from '@mui/icons-material';
import { AWS_REGIONS, AWS_REGION_NAMES, type AWSRegion } from '../../../../types/ai';

/**
 * Props do componente RegionFilter
 */
export interface RegionFilterProps {
  /** Região selecionada (null = todas as regiões) */
  selectedRegion: AWSRegion | null;
  /** Callback quando a região é alterada */
  onChange: (region: AWSRegion | null) => void;
  /** Label do select */
  label?: string;
  /** Tamanho do componente */
  size?: 'small' | 'medium';
  /** Largura do componente */
  fullWidth?: boolean;
  /** Desabilitar o componente */
  disabled?: boolean;
}

/**
 * Componente de filtro de região AWS
 * 
 * Select dropdown com todas as regiões AWS suportadas e opção "Todas as regiões".
 * Design consistente com Material-UI.
 * 
 * @example
 * ```tsx
 * // Uso básico
 * const [region, setRegion] = useState<AWSRegion | null>(null);
 * 
 * <RegionFilter
 *   selectedRegion={region}
 *   onChange={setRegion}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Com label customizado
 * <RegionFilter
 *   selectedRegion={region}
 *   onChange={setRegion}
 *   label="Filtrar por Região"
 *   size="small"
 *   fullWidth
 * />
 * ```
 */
export function RegionFilter({
  selectedRegion,
  onChange,
  label = 'Região AWS',
  size = 'small',
  fullWidth = false,
  disabled = false
}: RegionFilterProps) {
  
  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onChange(value === 'all' ? null : value as AWSRegion);
  };

  return (
    <FormControl 
      size={size} 
      fullWidth={fullWidth}
      disabled={disabled}
    >
      <InputLabel id="region-filter-label">{label}</InputLabel>
      <Select
        labelId="region-filter-label"
        id="region-filter"
        value={selectedRegion || 'all'}
        label={label}
        onChange={handleChange}
        startAdornment={<Public sx={{ mr: 1, fontSize: 20, color: 'action.active' }} />}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center'
          }
        }}
      >
        <MenuItem value="all">
          <em>Todas as Regiões</em>
        </MenuItem>
        {AWS_REGIONS.map((region) => (
          <MenuItem key={region} value={region}>
            {AWS_REGION_NAMES[region]} ({region})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

/**
 * Componente auxiliar de filtro de região compacto (apenas ícone + dropdown)
 * 
 * @example
 * ```tsx
 * <CompactRegionFilter
 *   selectedRegion={region}
 *   onChange={setRegion}
 * />
 * ```
 */
export interface CompactRegionFilterProps {
  /** Região selecionada (null = todas as regiões) */
  selectedRegion: AWSRegion | null;
  /** Callback quando a região é alterada */
  onChange: (region: AWSRegion | null) => void;
  /** Desabilitar o componente */
  disabled?: boolean;
}

export function CompactRegionFilter({
  selectedRegion,
  onChange,
  disabled = false
}: CompactRegionFilterProps) {
  
  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onChange(value === 'all' ? null : value as AWSRegion);
  };

  return (
    <Select
      size="small"
      value={selectedRegion || 'all'}
      onChange={handleChange}
      disabled={disabled}
      startAdornment={<Public sx={{ mr: 0.5, fontSize: 18, color: 'action.active' }} />}
      sx={{
        minWidth: 180,
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          py: 0.5
        }
      }}
    >
      <MenuItem value="all">
        <em>Todas</em>
      </MenuItem>
      {AWS_REGIONS.map((region) => (
        <MenuItem key={region} value={region}>
          {region}
        </MenuItem>
      ))}
    </Select>
  );
}
