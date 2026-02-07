/**
 * frontend/src/features/settings/components/ModelsManagement/components/ModelTableRow.tsx
 * Table row component for individual model display
 * Standards: docs/STANDARDS.md §3.0, §15
 */

import {
  TableRow,
  TableCell,
  Checkbox,
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { StatusBadge } from '@/components/Badges';
import { ModelRatingStars } from '@/components/ModelRating';
import { ModelBadgeGroup } from '@/components/ModelBadges';
import { useModelRating } from '@/hooks/useModelRating';
import { logger } from '@/utils/logger';
import type { ModelWithProvider } from '../types';

interface ModelTableRowProps {
  model: ModelWithProvider;
  isCertified: boolean;
  isSelected: boolean;
  isCertifying: boolean;
  onToggle: (modelId: string) => void;
  onCertify: (modelId: string) => void;
}

/**
 * Linha da tabela de modelos com informações e ações
 */
export function ModelTableRow({
  model,
  isCertified,
  isSelected,
  isCertifying,
  onToggle,
  onCertify,
}: ModelTableRowProps) {
  const { getModelById } = useModelRating();
  const modelWithRating = getModelById(model.apiModelId);

  const isAWSProvider = model.providerSlug === 'aws' || model.providerSlug === 'bedrock';

  logger.debug(`[ModelTableRow] 🎨 Renderizando badge para ${model.apiModelId}:`, {
    isCertified,
  });

  return (
    <TableRow hover selected={isSelected}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={isSelected}
          onChange={() => onToggle(model.apiModelId)}
          disabled={!isAWSProvider}
        />
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {model.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {model.apiModelId}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <StatusBadge
          label={model.providerName}
          status="default"
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell align="center">
        {isCertified ? (
          <StatusBadge
            label="Certificado"
            status="success"
            icon={<CheckCircleIcon />}
            size="small"
          />
        ) : (
          <StatusBadge
            label="Não Testado"
            status="default"
            icon={<HelpOutlineIcon />}
            size="small"
          />
        )}
      </TableCell>
      <TableCell align="center">
        {modelWithRating?.rating ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <ModelRatingStars
              rating={modelWithRating.rating}
              size="sm"
              showValue={false}
            />
            <ModelBadgeGroup
              model={{ apiModelId: model.apiModelId }}
              size="sm"
              spacing={0.5}
            />
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            N/A
          </Typography>
        )}
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">
          {Math.round(model.contextWindow / 1024)}k tokens
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Tooltip
          title={isCertified ? 'Recertificar modelo' : 'Certificar modelo'}
          arrow
        >
          <span>
            <IconButton
              size="small"
              color="primary"
              onClick={() => onCertify(model.apiModelId)}
              disabled={isCertifying || !isAWSProvider}
            >
              {isCertifying ? <CircularProgress size={20} /> : <VerifiedUserIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
