// frontend/src/features/chat/components/ControlPanel/ModelSelectionTab.tsx

import { useEffect, useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Typography, 
  SelectChangeEvent,
  Chip,
  Alert
} from '@mui/material';
import { SmartToy as BotIcon, Memory as ChipIcon } from '@mui/icons-material';
import { aiProvidersService } from '../../../../services/aiProvidersService';
import { AIProvider } from '../../../../types/ai';
import { useLayout } from '../../../../contexts/LayoutContext'; // <--- O SEGREDO

export function ModelSelectionTab() {
  // Estado apenas para a LISTA de opções (o dado que vem do backend)
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // O Estado da SELEÇÃO vem do Contexto Global agora!
  const { chatConfig, updateChatConfig } = useLayout(); 

  // 1. Buscar dados ao carregar
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await aiProvidersService.getAll();
        setProviders(data);
        
        // Lógica de Auto-seleção Inteligente:
        // Se o chatConfig estiver vazio OU se o provider salvo não existir mais na lista atual...
        const currentProviderValid = data.find(p => p.slug === chatConfig.provider);
        
        if (!chatConfig.provider || !currentProviderValid) {
           // ...seleciona o primeiro da lista automaticamente
           if (data.length > 0) {
             const firstProvider = data[0];
             const firstModel = firstProvider.models[0]?.apiModelId || '';
             
             updateChatConfig({
               provider: firstProvider.slug,
               model: firstModel
             });
           }
        }
      } catch (err) {
        setError('Não foi possível carregar a lista de IAs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []); // Executa na montagem

  // 2. Handlers Conectados ao Contexto Global
  const handleProviderChange = (event: SelectChangeEvent) => {
    const newSlug = event.target.value;
    
    // Encontra o provider novo para pegar o modelo padrão dele
    const providerData = providers.find(p => p.slug === newSlug);
    const defaultModel = providerData?.models[0]?.apiModelId || '';

    // Salva no Contexto Global (O useChatLogic vai ler daqui!)
    updateChatConfig({
      provider: newSlug,
      model: defaultModel
    });
  };

  const handleModelChange = (event: SelectChangeEvent) => {
    updateChatConfig({
      model: event.target.value
    });
  };

  // Computados para UI
  const activeProvider = providers.find(p => p.slug === chatConfig.provider);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Defina qual Inteligência Artificial responderá suas mensagens.
      </Typography>

      {/* Seletor de Provedor */}
      <FormControl fullWidth>
        <InputLabel id="provider-select-label">Provedor</InputLabel>
        <Select
          labelId="provider-select-label"
          value={chatConfig.provider || ''} // Lê do Contexto
          label="Provedor"
          onChange={handleProviderChange}
          startAdornment={<BotIcon sx={{ mr: 1, color: 'primary.main' }} />}
        >
          {providers.map((provider) => (
            <MenuItem key={provider.id} value={provider.slug}>
              {provider.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Seletor de Modelo */}
      <FormControl fullWidth disabled={!chatConfig.provider}>
        <InputLabel id="model-select-label">Modelo</InputLabel>
        <Select
          labelId="model-select-label"
          value={chatConfig.model || ''} // Lê do Contexto
          label="Modelo"
          onChange={handleModelChange}
          startAdornment={<ChipIcon sx={{ mr: 1, color: 'secondary.main' }} />}
        >
          {activeProvider?.models.map((model) => (
            <MenuItem key={model.id} value={model.apiModelId}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Typography>{model.name}</Typography>
                <Chip 
                  label={`${Math.round(model.contextWindow / 1024)}k tokens`} 
                  size="small" 
                  variant="outlined" 
                  sx={{ height: 20, fontSize: '0.65rem', ml: 1 }} 
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Debug Info (Visual - Pode remover depois) */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
         <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
           <strong>Config Global:</strong> {chatConfig.provider} / {chatConfig.model}
         </Typography>
      </Box>
    </Box>
  );
}
