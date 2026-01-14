// backend/src/middlewares/error-handler.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, ErrorRequestHandler } from 'express';
import { ApiResponse } from '../utils/api-response';

// Middleware global de tratamento de erros (JSend, JWT, sintaxe, credenciais)
export const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response
) => {
  // 1. Erro de autenticação JWT (express-jwt, etc)
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(ApiResponse.fail({ message: 'Token inválido ou ausente' }));
  }

  // 2. Erro de sintaxe no JSON do body
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json(ApiResponse.fail({ message: 'JSON malformado. Verifique caracteres extras.' }));
  }

  // 3. Erros de credenciais (login social ou padrão)
  if (err.message === 'Invalid credentials' || err.name === 'AppError') {
    return res.status(401).json(ApiResponse.fail({ message: err.message }));
  }

  // 4. Log detalhado para desenvolvedor
  console.error(' [ERROR] ', err);

  // 5. Erro genérico (500)
  return res.status(500).json(
    ApiResponse.error(err.message || 'Erro interno no servidor')
  );
};
