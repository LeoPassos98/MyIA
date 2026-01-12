// backend/src/features/auth/auth.schema.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Formato de e-mail inválido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    avatarUrl: z.string().url().optional(),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(1, "A senha é obrigatória"),
  })
});
