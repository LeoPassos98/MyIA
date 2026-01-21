// backend/src/middleware/validators/authValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { z } from 'zod';

/**
 * IMPORTANTE: O validateRequest middleware passa { body, query, params }
 * então todos os schemas precisam ter o wrapper apropriado
 */

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  })
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    name: z.string().optional(),
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6, 'Senha antiga deve ter no mínimo 6 caracteres'),
    newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  })
});