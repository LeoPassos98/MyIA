// frontend/src/features/chat/components/input/InputTextField.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { KeyboardEvent, useState } from 'react';
import { TextField } from '@mui/material';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';

interface InputTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputTextField({
  value,
  onChange,
  onKeyDown,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
}: InputTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextField
      fullWidth
      multiline
      maxRows={9}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 7,
          transition: 'all 0.3s ease',

          '& fieldset': {
            borderColor: isFocused ? 'primary.main' : 'divider',
            borderWidth: isFocused ? 2 : 1,
          },
          '&.Mui-focused fieldset': {
            borderColor: 'primary.main',
            borderWidth: 2,
          },
        },
      }}
      slotProps={{
        htmlInput: {
          sx: scrollbarStyles, // Scrollbar no textarea segue o tema
        },
      }}
    />
  );
}
