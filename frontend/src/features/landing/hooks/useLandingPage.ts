// frontend/src/features/landing/hooks/useLandingPage.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const useLandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return {
    handleLogin,
  };
};

export default useLandingPage;
