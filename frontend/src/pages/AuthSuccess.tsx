// frontend/src/pages/AuthSuccess.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Pegamos o token da URL (?token=ey...)
    const token = searchParams.get('token');

    if (token) {
      // 2. Salvamos no localStorage (ou use seu authService)
      localStorage.setItem('token', token);
      // Opcional: Se você retornar o usuário na URL também, pode salvar aqui
      // localStorage.setItem('user', JSON.stringify(userData));

      console.log('✅ Login Social realizado com sucesso!');
      // 3. Redireciona para o Dashboard após um pequeno delay para o usuário ver
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      console.error('❌ Token não encontrado na URL');
      navigate('/login?error=no_token');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h2 className="text-xl font-semibold animate-pulse">Sincronizando com MyIA...</h2>
      </div>
    </div>
  );
};
