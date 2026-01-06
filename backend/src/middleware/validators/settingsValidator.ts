// backend/src/middleware/validators/settingsValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { z } from 'zod';

/**
 * Schema de validação para atualização de configurações do usuário
 */
export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().optional(),
  notifications: z.boolean().optional(),
  // Adicione outros campos de settings conforme necessário
}).strict(); // strict() impede campos desconhecidos

/**
 * Schema de validação para atualização de credenciais de API
 */
export const updateCredentialsSchema = z.object({
  provider: z.string().min(1, 'Provider é obrigatório'),
  apiKey: z.string().min(10, 'API Key deve ter no mínimo 10 caracteres'),
}).strict();
