// frontend/src/features/chat/components/ControlPanel/VendorSelector.example.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { VendorSelector } from './VendorSelector';
import type { VendorGroup } from '../../../../types/ai';

/**
 * Exemplo de uso do componente VendorSelector
 * Para testar, importe este componente em uma página ou rota temporária
 */
export function VendorSelectorExample() {
  const [selectedVendor, setSelectedVendor] = useState<string | null>('anthropic');
  const [disabled, setDisabled] = useState(false);

  // Mock data para teste
  const mockVendors: VendorGroup[] = [
    {
      id: 'anthropic',
      name: 'Anthropic',
      slug: 'anthropic',
      logo: '/assets/vendors/anthropic.svg',
      models: [
        { id: '1', name: 'Claude 3.5 Sonnet', apiModelId: 'claude-3-5-sonnet', contextWindow: 200000, availableOn: [] },
        { id: '2', name: 'Claude 3 Opus', apiModelId: 'claude-3-opus', contextWindow: 200000, availableOn: [] },
        { id: '3', name: 'Claude 3 Haiku', apiModelId: 'claude-3-haiku', contextWindow: 200000, availableOn: [] },
      ]
    },
    {
      id: 'amazon',
      name: 'Amazon',
      slug: 'amazon',
      logo: '/assets/vendors/amazon.svg',
      models: [
        { id: '4', name: 'Titan Text G1', apiModelId: 'amazon.titan-text-express-v1', contextWindow: 8000, availableOn: [] },
        { id: '5', name: 'Titan Embeddings', apiModelId: 'amazon.titan-embed-text-v1', contextWindow: 8000, availableOn: [] },
      ]
    },
    {
      id: 'cohere',
      name: 'Cohere',
      slug: 'cohere',
      logo: '/assets/vendors/cohere.svg',
      models: [
        { id: '6', name: 'Command R+', apiModelId: 'cohere.command-r-plus-v1:0', contextWindow: 128000, availableOn: [] },
      ]
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      slug: 'mistral',
      logo: '/assets/vendors/mistral.svg',
      models: []
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          🧪 VendorSelector - Exemplo de Uso
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Componente para seleção visual de vendors (empresas/criadores de modelos)
        </Typography>

        {/* Controles de teste */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2">
            <strong>Vendor Selecionado:</strong> {selectedVendor || 'Nenhum'}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              cursor: 'pointer', 
              color: 'primary.main',
              textDecoration: 'underline'
            }}
            onClick={() => setDisabled(!disabled)}
          >
            {disabled ? '🔓 Habilitar' : '🔒 Desabilitar'}
          </Typography>
        </Box>

        {/* Componente sendo testado */}
        <VendorSelector
          vendors={mockVendors}
          selectedVendor={selectedVendor}
          onSelect={(slug) => {
            console.log('Vendor selecionado:', slug);
            setSelectedVendor(slug);
          }}
          disabled={disabled}
        />

        {/* Estado vazio */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Estado Vazio (sem vendors):
          </Typography>
          <VendorSelector
            vendors={[]}
            selectedVendor={null}
            onSelect={() => {}}
          />
        </Box>
      </Paper>
    </Container>
  );
}
