// frontend/src/components/Layout/MainHeader/HeaderCenter.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box } from '@mui/material';
import Logo from '../../Logo';
import React from 'react';

interface HeaderCenterProps {
  slots: any;
}

const HeaderCenter: React.FC<HeaderCenterProps> = ({ slots }) => (
  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 }}>
    {slots.center ? slots.center : <Logo brandText={slots.brandText} />}
  </Box>
);

export default HeaderCenter;
