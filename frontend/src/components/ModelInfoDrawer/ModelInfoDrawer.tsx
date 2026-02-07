// frontend/src/components/ModelInfoDrawer/ModelInfoDrawer.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MODULARIZED: Seção 15 - File Size Limits

import { memo, useState, useEffect } from 'react';
import { Drawer, Box, Divider, useTheme, alpha } from '@mui/material';
import { EnrichedAWSModel, CertificationDetails } from '@/types/ai';
import { certificationService } from '@/services/certificationService';
import {
  DrawerHeader,
  ModelDetails,
  CapabilitiesSection,
  PricingSection,
  CertificationSection,
} from './sections';

export interface ModelInfoDrawerProps {
  open: boolean;
  model: EnrichedAWSModel | null;
  onClose: () => void;
  isCertified?: boolean;
  hasQualityWarning?: boolean;
  isUnavailable?: boolean;
}

/**
 * Drawer lateral profissional para exibir informações detalhadas do modelo
 * 
 * ✅ Vantagens sobre Tooltip:
 * - Mais espaço para informações
 * - Melhor UX em mobile
 * - Sem problemas de posicionamento
 * - Animação suave
 * - Acessível
 * 
 * 📱 Mobile-friendly
 * 🎨 Design limpo e moderno
 * ⚡ Performance otimizada
 */
export const ModelInfoDrawer = memo(({
  open,
  model,
  onClose,
  isCertified = false,
  hasQualityWarning = false,
  isUnavailable = false,
}: ModelInfoDrawerProps) => {
  const theme = useTheme();
  const [certDetails, setCertDetails] = useState<CertificationDetails | null>(null);
  const [loadingCertDetails, setLoadingCertDetails] = useState(false);

  // Buscar detalhes da certificação quando o drawer abrir
  useEffect(() => {
    if (open && model && (isCertified || hasQualityWarning || isUnavailable)) {
      setLoadingCertDetails(true);
      certificationService.getCertificationDetails(model.apiModelId)
        .then(details => {
          setCertDetails(details);
        })
        .catch(error => {
          console.error('Erro ao buscar detalhes da certificação:', error);
        })
        .finally(() => {
          setLoadingCertDetails(false);
        });
    } else {
      setCertDetails(null);
    }
  }, [open, model, isCertified, hasQualityWarning, isUnavailable]);

  if (!model) return null;

  const hasDbInfo = model.isInDatabase !== false;
  const hasCostInfo = model.costPer1kInput > 0 || model.costPer1kOutput > 0;
  const showCertification = isCertified || hasQualityWarning || isUnavailable;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100vw',
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.95)
            : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
        },
      }}
      transitionDuration={250}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <DrawerHeader onClose={onClose} />

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <ModelDetails
            name={model.name}
            apiModelId={model.apiModelId}
            providerName={model.providerName}
            hasDbInfo={hasDbInfo}
            responseStreamingSupported={model.responseStreamingSupported}
          />

          <Divider sx={{ my: 2 }} />

          <CapabilitiesSection
            contextWindow={model.contextWindow}
            hasDbInfo={hasDbInfo}
          />

          {hasCostInfo && (
            <PricingSection
              costPer1kInput={model.costPer1kInput}
              costPer1kOutput={model.costPer1kOutput}
            />
          )}

          {showCertification && (
            <CertificationSection
              certDetails={certDetails}
              loadingCertDetails={loadingCertDetails}
              isCertified={isCertified}
              hasQualityWarning={hasQualityWarning}
              isUnavailable={isUnavailable}
            />
          )}
        </Box>
      </Box>
    </Drawer>
  );
});

ModelInfoDrawer.displayName = 'ModelInfoDrawer';
