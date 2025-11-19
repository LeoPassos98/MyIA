import { Box, TextField, IconButton, FormControlLabel, Switch, Paper } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isDevMode: boolean;
  setIsDevMode: (val: boolean) => void;
  isManualMode: boolean;
  isDrawerOpen: boolean;
}

export default function ChatInput({
  inputMessage,
  setInputMessage,
  onSend,
  isLoading,
  isDevMode,
  setIsDevMode,
  isManualMode,
  isDrawerOpen,
}: ChatInputProps) {
  return (
    <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
        <Box sx={{ marginLeft: 'auto' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isDevMode}
                onChange={(e) => setIsDevMode(e.target.checked)}
                size="small"
              />
            }
            label="Modo Dev"
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder={isManualMode ? 'Digite sua mensagem (Modo Manual)...' : 'Digite sua mensagem...'}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={isLoading || isDrawerOpen}
          helperText={isDrawerOpen ? 'Feche o painel do editor para enviar.' : ''}
          multiline
          maxRows={4}
        />
        <IconButton
          color="primary"
          onClick={(e) => {
            e.preventDefault();
            onSend();
          }}
          disabled={!inputMessage.trim() || isLoading || isDrawerOpen}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
