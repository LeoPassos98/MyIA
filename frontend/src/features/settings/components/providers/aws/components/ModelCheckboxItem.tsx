// frontend/src/features/settings/components/providers/aws/components/ModelCheckboxItem.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { memo } from 'react';
import {
  Box, FormControlLabel, Checkbox, Typography, IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { EnrichedAWSModel } from '@/types/ai';
import { ModelBadgeGroup } from '@/components/ModelBadges';
import { OptimizedTooltip } from '@/components/OptimizedTooltip';

/**
 * Props do componente ModelCheckboxItem
 */
export interface ModelCheckboxItemProps {
  model: EnrichedAWSModel;
  isSelected: boolean;
  onToggle: (id: string) => void;
  disabled: boolean;
  isUnavailable: boolean;
  onShowInfo: (model: EnrichedAWSModel) => void;
}

/**
 * Item de checkbox para seleção de modelo individual
 * 
 * Componente memoizado para otimizar performance em listas grandes.
 * Substituído Tooltip pesado do MUI por botão de info que abre drawer.
 * 
 * @param props - Props do componente
 */
export const ModelCheckboxItem = memo(function ModelCheckboxItem(props: ModelCheckboxItemProps) {
  const { model, isSelected, onToggle, disabled, isUnavailable, onShowInfo } = props;
  
  const hasCostInfo = model.costPer1kInput > 0 || model.costPer1kOutput > 0;
  
  return (
    <FormControlLabel
      disabled={disabled}
      control={
        <Checkbox
          // ✅ CORREÇÃO: O estado visual do checkbox deve refletir apenas isSelected
          // A lógica de desabilitar modelos failed é feita via disabled={isUnavailable}
          // Isso garante que:
          // - Modelos certified/quality_warning: checkbox marca/desmarca normalmente
          // - Modelos failed: checkbox sempre desmarcado (isSelected será false) e desabilitado
          checked={isSelected}
          onChange={() => onToggle(model.apiModelId)}
          tabIndex={0}
          disabled={disabled || isUnavailable}
        />
      }
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{model.name}</Typography>
              {/* MIGRATED: Usando novo sistema centralizado de badges (ModelBadgeGroup) */}
              {/* Ver: plans/badge-system-centralization.md - Fase 3 */}
              <ModelBadgeGroup
                model={{ apiModelId: model.apiModelId }}
                size="sm"
                spacing={0.5}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
              {model.apiModelId}
            </Typography>
            {hasCostInfo && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                ${model.costPer1kInput}/1k in • ${model.costPer1kOutput}/1k out
              </Typography>
            )}
          </Box>
          {/* ✅ Botão de info que abre drawer profissional */}
          <OptimizedTooltip content="Ver detalhes do modelo" placement="left" delay={500}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onShowInfo(model);
              }}
              sx={{ ml: 1 }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </OptimizedTooltip>
        </Box>
      }
    />
  );
});
