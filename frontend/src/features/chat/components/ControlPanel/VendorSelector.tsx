// frontend/src/features/chat/components/ControlPanel/VendorSelector.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MIGRATED: Fase 3 - Padronização Visual

import React from 'react';
import { Box, Card, CardActionArea, Typography, Grid, Skeleton } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { CounterBadge } from '@/components/Badges';
import type { VendorGroup } from '../../../../types/ai';

// Import logos
import awsLogo from '../../../../assets/providers/aws.svg';
import defaultLogo from '../../../../assets/providers/default.svg';

// Mapeamento de logos dos vendors
const vendorLogos: Record<string, string> = {
  'amazon': awsLogo,
  'anthropic': defaultLogo, // TODO: adicionar logo Anthropic
  'cohere': defaultLogo,    // TODO: adicionar logo Cohere
  'meta': defaultLogo,      // TODO: adicionar logo Meta
  'mistral': defaultLogo,   // TODO: adicionar logo Mistral
};

export interface VendorSelectorProps {
  vendors: VendorGroup[];
  selectedVendor: string | null;
  onSelect: (vendorSlug: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * Seletor visual de vendors (empresas/criadores de modelos)
 * Exibe grid de cards clicáveis com logos e contador de modelos
 * 
 * @example
 * ```tsx
 * <VendorSelector
 *   vendors={vendors}
 *   selectedVendor="anthropic"
 *   onSelect={(slug) => setSelectedVendor(slug)}
 * />
 * ```
 */
export const VendorSelector = React.memo(function VendorSelector({
  vendors,
  selectedVendor,
  onSelect,
  disabled = false,
  isLoading = false
}: VendorSelectorProps) {
  
  // Loading skeleton
  if (isLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <BusinessIcon fontSize="small" /> Selecione a Empresa
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton
                variant="rectangular"
                height={80}
                sx={{
                  borderRadius: 2,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.6 },
                    '50%': { opacity: 0.3 }
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  
  // Empty state melhorado
  if (vendors.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <BusinessIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Nenhum vendor disponível
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Configure um provider (AWS Bedrock ou Azure) nas configurações para ver os vendors disponíveis.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <BusinessIcon fontSize="small" /> Selecione a Empresa
      </Typography>
      
      <Grid container spacing={2}>
        {vendors.map((vendor) => {
          const isSelected = selectedVendor === vendor.slug;
          const modelCount = vendor.models.length;
          
          return (
            <Grid item xs="auto" md="auto" sm="auto" key={vendor.id}>
              <Card
                elevation={isSelected ? 3 : 1}
                sx={{
                  minWidth: 0,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'backgrounds.secondarySubtle' : 'background.paper',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: disabled ? 0.6 : 1,
                  animation: 'fadeIn 0.3s ease-in',
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(8px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  },
                  '&:hover': disabled ? {} : {
                    transform: 'scale(1.05)',
                    elevation: 4,
                    borderColor: isSelected ? 'primary.main' : 'primary.light',
                  }
                }}
              >
                <CardActionArea
                  onClick={() => !disabled && onSelect(vendor.slug)}
                  disabled={disabled}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    minHeight: 80,
                  }}
                  aria-label={`Selecionar ${vendor.name} (${modelCount} modelos)`}
                >
                  {/* Logo */}
                  <Box
                    component="img"
                    src={vendorLogos[vendor.slug] || defaultLogo}
                    alt={`${vendor.name} logo`}
                    sx={{
                      width: 32,
                      height: 32,
                      objectFit: 'contain',
                      filter: disabled ? 'grayscale(100%)' : 'none'
                    }}
                    onError={(e) => {
                      // Fallback para logo padrão se houver erro
                      (e.target as HTMLImageElement).src = defaultLogo;
                    }}
                  />
                  
                  {/* Nome */}
                  <Typography
                    variant="body2"
                    fontWeight={isSelected ? 600 : 500}
                    textAlign="center"
                    color={isSelected ? 'primary.main' : 'text.primary'}
                  >
                    {vendor.name}
                  </Typography>
                  
                  {/* Contador de modelos */}
                  <CounterBadge
                    count={modelCount}
                    label={modelCount === 1 ? 'modelo' : 'modelos'}
                    color={isSelected ? 'primary' : 'default'}
                  />
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
});
