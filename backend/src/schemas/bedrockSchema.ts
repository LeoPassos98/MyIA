// backend/src/schemas/bedrockSchema.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { z } from 'zod';

// Lista de regiões AWS permitidas para Bedrock
const allowedRegions = [
  'us-east-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'ap-southeast-1',
  'ap-northeast-1',
] as const;

// Regex para Access Key AWS (20 caracteres maiúsculos)
const accessKeyRegex = /^[A-Z0-9]{20}$/;

// Regex para Secret Key AWS (40 caracteres base64-like)
const secretKeyRegex = /^[A-Za-z0-9+/]{40}$/;

export const bedrockConfigSchema = z.object({
  useStoredCredentials: z.boolean().optional().default(false),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  region: z.enum(allowedRegions, {
    errorMap: () => ({ message: 'Região AWS inválida para Bedrock' }),
  }),
}).refine(
  (data) => {
    if (data.useStoredCredentials) {
      // Se usar credenciais armazenadas, accessKey e secretKey são opcionais
      return true;
    } else {
      // Caso contrário, obrigatórios e devem passar no regex
      return (
        data.accessKey &&
        accessKeyRegex.test(data.accessKey) &&
        data.secretKey &&
        secretKeyRegex.test(data.secretKey)
      );
    }
  },
  {
    message: 'Credenciais inválidas: Access Key deve ter 20 caracteres maiúsculos, Secret Key 40 caracteres base64',
    path: ['accessKey', 'secretKey'],
  }
);

export type BedrockConfig = z.infer<typeof bedrockConfigSchema>;