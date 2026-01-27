// backend/src/features/auth/auth.controller.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { ApiResponse } from '../../utils/api-response';
import logger from '../../utils/logger';

export class AuthController {
  static async socialLoginCallback(req: any, res: Response) {
    try {
      // O Passport coloca o usuário do banco dentro de 'req.user' após o sucesso
      const user = req.user;

      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      // Geramos o token JWT da MyIA para esse usuário
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' } // Token válido por uma semana
      );

      // Redirecionamos para uma rota específica no Frontend que vai salvar o token
      // Exemplo: http://localhost:5173/auth-success?token=ey...
      return res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
      
    } catch (error) {
      logger.error('Erro no callback social:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { name, email, password } = req.body;

      // 1. Verificar se usuário já existe
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json(ApiResponse.fail({ email: 'E-mail já cadastrado.' }));
      }

      // 2. Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Criar usuário e suas configurações iniciais (Transação Prisma)
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            settings: {
              create: { theme: 'light' }
            }
          },
          include: { settings: true }
        });
        return user;
      });

      // 4. Remover senha do retorno
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = newUser;

      return res.status(201).json(
        ApiResponse.success({ userId: newUser.id, message: "User registered successfully", user: userWithoutPassword })
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      // 1. Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email },
        include: { settings: true }
      });

      if (!user) {
        return res.status(401).json(ApiResponse.fail({ message: 'Credenciais inválidas.' }));
      }

      // 2. Validar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json(ApiResponse.fail({ message: 'Credenciais inválidas.' }));
      }

      // 3. Gerar JWT
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'secret_fallback',
        { expiresIn: '7d' }
      );

      // 4. Retorno padronizado
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json(ApiResponse.success({
        user: userWithoutPassword,
        token
      }));
    } catch (error) {
      next(error);
    }
  }
}
