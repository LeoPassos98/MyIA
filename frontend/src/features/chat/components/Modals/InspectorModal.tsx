import { Modal, Paper, Typography, Box } from '@mui/material';
import { DataObject as DataObjectIcon } from '@mui/icons-material';

interface InspectorModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export const InspectorModal = ({ open, onClose, data }: InspectorModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper
        sx={{
          maxWidth: '80vw',
          maxHeight: '80vh',
          overflow: 'auto',
          p: 3,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DataObjectIcon /> Inspetor de JSON (V26 - Bruto)
        </Typography>

        <Box
          sx={{
            backgroundColor: '#1E1E1E',
            borderRadius: 1,
            p: 2,
            maxHeight: '60vh',
            overflow: 'auto',
          }}
        >
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              color: '#00FF00',
              fontSize: '12px',
              lineHeight: 1.6,
            }}
          >
            {data ? JSON.stringify(data, null, 2) : '(Nenhum dado selecionado)'}
          </pre>
        </Box>
      </Paper>
    </Modal>
  );
};
