import { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, Alert, useTheme } from '@mui/material';
import { userSettingsService, UserSettings } from '../../../services/userSettingsService';
import { SettingsSection } from './SettingsSection';

interface ApiKeysTabProps {
  userSettings: UserSettings | null;
  onUpdate: (settings: UserSettings) => void;
}

export default function ApiKeysTab({ userSettings, onUpdate }: ApiKeysTabProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (userSettings) {
      setFormData({
        openaiApiKey: (userSettings as any).openaiApiKey || '',
        groqApiKey: (userSettings as any).groqApiKey || '',
        claudeApiKey: (userSettings as any).claudeApiKey || '',
        togetherApiKey: (userSettings as any).togetherApiKey || '',
        perplexityApiKey: (userSettings as any).perplexityApiKey || '',
        mistralApiKey: (userSettings as any).mistralApiKey || '',
      });
    }
  }, [userSettings]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const dataToUpdate: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() !== '') dataToUpdate[key] = value;
      });
      const updated = await userSettingsService.updateSettings(dataToUpdate);
      onUpdate(updated);
      setMsg({ type: 'success', text: 'Chaves salvas com sucesso!' });
    } catch (error) {
      setMsg({ type: 'error', text: 'Erro ao salvar chaves.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <SettingsSection title="Chaves de API" description="Gerencie suas conexões com provedores de IA.">
      {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}
      
      <Grid container spacing={3}>
        {[
          { id: 'openaiApiKey', label: 'OpenAI API Key', hint: 'GPT-3.5, GPT-4' },
          { id: 'groqApiKey', label: 'Groq API Key', hint: 'Llama 3 (Rápido)' },
          { id: 'claudeApiKey', label: 'Claude API Key', hint: 'Claude 3 Sonnet/Opus' },
          { id: 'togetherApiKey', label: 'Together.ai', hint: 'Mixtral, Llama' },
          { id: 'perplexityApiKey', label: 'Perplexity', hint: 'Sonar Online' },
          { id: 'mistralApiKey', label: 'Mistral AI', hint: 'Mistral Large' },
        ].map((field) => (
          <Grid item xs={12} md={6} key={field.id}>
            <TextField
              fullWidth
              type="password"
              label={field.label}
              value={formData[field.id] || ''}
              onChange={handleChange(field.id)}
              helperText={field.hint}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        ))}
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={isSaving}
              sx={{ background: theme.gradients.primary, fontWeight: 'bold' }}
            >
              {isSaving ? 'Salvando...' : 'Salvar Chaves'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </SettingsSection>
  );
}
