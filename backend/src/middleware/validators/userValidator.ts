// backend/src/middleware/validators/userValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { z } from 'zod';

/**
 * Schema de validação para atualização de perfil do usuário
 */
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo (máximo 100 caracteres)')
    .optional(),
  email: z.string()
    .email('Email inválido')
    .optional(),
}).strict();
