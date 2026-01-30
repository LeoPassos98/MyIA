// frontend/src/components/ModelRating/BadgeComparisonDemo.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { ModelBadge } from './ModelBadge';

/**
 * Componente de demonstração visual da padronização entre ModelBadge e MUI Chip
 * 
 * ✅ Propósito:
 * - Demonstrar que ambos os badges têm aparência visual idêntica
 * - Facilitar testes visuais de consistência
 * - Servir como referência para desenvolvedores
 * 
 * 🎯 Uso:
 * - Adicione este componente temporariamente em uma página para testar
 * - Verifique se border-radius, padding, border e hover são idênticos
 * - Remova após confirmar a padronização
 * 
 * @example
 * import { BadgeComparisonDemo } from '@/components/ModelRating/BadgeComparisonDemo';
 * 
 * <BadgeComparisonDemo />
 */
export function BadgeComparisonDemo() {
  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🎨 Demonstração de Padronização de Badges
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Este componente demonstra a padronização visual entre ModelBadge (custom) e MUI Chip (status).
        Ambos devem ter aparência idêntica: border-radius 12px, padding 4px 12px, border 1px solid.
      </Typography>

      {/* Seção 1: ModelBadge (Rating) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1️⃣ ModelBadge (Custom) - Ratings de Qualidade
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Usado para representar a qualidade/rating do modelo baseado em métricas.
          <br />
          <strong>Arquivo:</strong> frontend/src/components/ModelRating/ModelBadge.tsx
          <br />
          <strong>CSS:</strong> frontend/src/components/ModelRating/ModelRating.css (.model-badge)
        </Typography>
        
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
          <ModelBadge badge="PREMIUM" size="md" showIcon />
          <ModelBadge badge="RECOMENDADO" size="md" showIcon />
          <ModelBadge badge="FUNCIONAL" size="md" showIcon />
          <ModelBadge badge="LIMITADO" size="md" showIcon />
          <ModelBadge badge="NAO_RECOMENDADO" size="md" showIcon />
          <ModelBadge badge="INDISPONIVEL" size="md" showIcon />
        </Stack>
      </Paper>

      {/* Seção 2: MUI Chip (Status) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          2️⃣ MUI Chip - Status de Certificação
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Usado para representar o status de certificação do modelo do backend.
          <br />
          <strong>Arquivo:</strong> frontend/src/components/ModelBadges/ModelBadgeGroup.tsx
          <br />
          <strong>Estilos:</strong> frontend/src/theme.ts (MuiChip styleOverrides)
        </Typography>
        
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
          <Chip label="✅ Certificado" size="small" color="success" />
          <Chip label="⚠️ Qualidade" size="small" color="warning" />
          <Chip label="❌ Indisponível" size="small" color="error" />
          <Chip label="⏸️ Não Testado" size="small" color="default" />
          <Chip label="Não Testado" size="small" color="default" />
        </Stack>
      </Paper>

      {/* Seção 3: Comparação Lado a Lado */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          3️⃣ Comparação Lado a Lado
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Badges lado a lado para verificar consistência visual.
          Ambos devem ter a mesma altura, border-radius, padding e comportamento de hover.
        </Typography>
        
        <Stack spacing={2}>
          {/* Linha 1: Verde */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ minWidth: 150 }}>
              Verde (Sucesso):
            </Typography>
            <ModelBadge badge="RECOMENDADO" size="md" showIcon />
            <Chip label="✅ Certificado" size="small" color="success" />
            <Typography variant="caption" color="text.secondary">
              ← Devem ter aparência idêntica
            </Typography>
          </Stack>

          {/* Linha 2: Amarelo */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ minWidth: 150 }}>
              Amarelo (Aviso):
            </Typography>
            <ModelBadge badge="FUNCIONAL" size="md" showIcon />
            <Chip label="⚠️ Qualidade" size="small" color="warning" />
            <Typography variant="caption" color="text.secondary">
              ← Devem ter aparência idêntica
            </Typography>
          </Stack>

          {/* Linha 3: Vermelho */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ minWidth: 150 }}>
              Vermelho (Erro):
            </Typography>
            <ModelBadge badge="NAO_RECOMENDADO" size="md" showIcon />
            <Chip label="❌ Indisponível" size="small" color="error" />
            <Typography variant="caption" color="text.secondary">
              ← Devem ter aparência idêntica
            </Typography>
          </Stack>

          {/* Linha 4: Cinza */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ minWidth: 150 }}>
              Cinza (Padrão):
            </Typography>
            <ModelBadge badge="INDISPONIVEL" size="md" showIcon />
            <Chip label="Não Testado" size="small" color="default" />
            <Typography variant="caption" color="text.secondary">
              ← Devem ter aparência idêntica
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Seção 4: Uso Combinado (Real) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          4️⃣ Uso Combinado (Cenário Real)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Como os badges aparecem juntos em um card de modelo real.
        </Typography>
        
        <Stack spacing={2}>
          {/* Modelo 1: Premium Certificado */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Claude 3 Opus
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ⭐⭐⭐⭐⭐ (5.0)
            </Typography>
            <Stack direction="row" spacing={1}>
              <ModelBadge badge="PREMIUM" size="sm" showIcon />
              <Chip label="✅ Certificado" size="small" color="success" />
            </Stack>
          </Paper>

          {/* Modelo 2: Funcional com Aviso */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Titan Text
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ⭐⭐⭐ (3.2)
            </Typography>
            <Stack direction="row" spacing={1}>
              <ModelBadge badge="FUNCIONAL" size="sm" showIcon />
              <Chip label="⚠️ Qualidade" size="small" color="warning" />
            </Stack>
          </Paper>

          {/* Modelo 3: Indisponível */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Nova Micro
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Sem rating
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip label="❌ Indisponível" size="small" color="error" />
            </Stack>
          </Paper>
        </Stack>
      </Paper>

      {/* Seção 5: Checklist de Verificação */}
      <Paper sx={{ p: 3, bgcolor: 'info.main', color: 'info.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          ✅ Checklist de Verificação Visual
        </Typography>
        <Typography variant="body2" component="div">
          Ao testar, verifique se:
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li>Border-radius é idêntico (12px) em ambos</li>
            <li>Padding é idêntico (4px 12px) em ambos</li>
            <li>Border é idêntico (1px solid) em ambos</li>
            <li>Font-weight é idêntico (600) em ambos</li>
            <li>Letter-spacing é idêntico (0.5px) em ambos</li>
            <li>Hover effect é idêntico (translateY + box-shadow) em ambos</li>
            <li>Cores seguem o padrão do theme</li>
            <li>Opacidade do background é 15% em ambos</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
}
