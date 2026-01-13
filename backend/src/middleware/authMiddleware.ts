// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { config } from '../config/env';

// 1. Definição da Interface Estendida
export interface AuthRequest extends Request {
  userId?: string;
}

// 2. Interface para o Payload do Token (O que tem dentro dele?)
interface TokenPayload {
  userId: string; // 🔧 FIX: Mudado de 'id' para 'userId'
  email: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  // 👇 ADICIONE ESSES LOGS DE DEBUG
  console.log(`[AuthMiddleware] Método: ${req.method} | URL: ${req.originalUrl}`);
  console.log('[AuthMiddleware] Headers recebidos:', req.headers.authorization ? 'Com Token' : 'SEM TOKEN');

  // Se for uma requisição de pré-verificação (OPTIONS), deixa passar sem checar token
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Vamos logar o erro antes de retornar
    console.error('[AuthMiddleware] ❌ Bloqueado: Header Authorization ausente');
    return next(new AppError('No token provided', 401));
  }

  // O formato deve ser "Bearer <token>"
  const [, token] = authHeader.split(' ');

  if (!token) {
    return next(new AppError('Token format invalid', 401));
  }

  try {
    // 🛑 CORREÇÃO 1: Garante ao TypeScript que o segredo é uma string
    // O env.ts já garante isso em tempo de execução, mas o TS precisa saber aqui.
    const secret = config.jwtSecret as string;

    // 🛑 CORREÇÃO 2: "Double casting" (as unknown as Type)
    // Isso diz ao TS: "Eu sei que o retorno do jwt é genérico, confie em mim, 
    // ele vai ter esse formato TokenPayload".
    const decoded = jwt.verify(token, secret) as unknown as TokenPayload;

    // 🔧 FIX: Agora usa decoded.userId (não decoded.id)
    req.userId = decoded.userId;

    return next();
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
};

// Exporta o alias
export const protect = authMiddleware;