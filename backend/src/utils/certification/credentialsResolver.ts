// backend/src/utils/certification/credentialsResolver.ts
// Standards: docs/STANDARDS.md
// Responsabilidade: Resolução de credenciais AWS para certificação

import { AWSCredentialsService, AWSCredentials } from '../../services/awsCredentialsService';
import { logger } from '../logger';

/**
 * Erro de validação de credenciais
 */
export class CredentialsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CredentialsValidationError';
  }
}

/**
 * Resolve credenciais AWS do banco de dados
 * 
 * @param userId - ID do usuário autenticado
 * @param requestId - ID da requisição para logging
 * @returns Credenciais AWS validadas
 * @throws CredentialsValidationError se credenciais não encontradas
 */
export async function resolveCredentials(
  userId: string,
  requestId?: string
): Promise<AWSCredentials> {
  logger.info('Resolvendo credenciais AWS', {
    requestId,
    userId
  });
  
  const credentials = await AWSCredentialsService.getCredentials(userId);
  
  if (!credentials) {
    logger.warn('Credenciais AWS não encontradas', {
      requestId,
      userId
    });
    throw new CredentialsValidationError('Credenciais AWS não configuradas');
  }
  
  logger.info('Credenciais AWS resolvidas com sucesso', {
    requestId,
    userId,
    region: credentials.region
  });
  
  return credentials;
}

/**
 * Valida se credenciais estão completas
 * 
 * @param credentials - Credenciais a validar
 * @returns true se válidas
 * @throws CredentialsValidationError se inválidas
 */
export function validateCredentials(credentials: AWSCredentials): boolean {
  if (!credentials.accessKey || !credentials.secretKey || !credentials.region) {
    throw new CredentialsValidationError('Credenciais AWS incompletas');
  }
  
  return true;
}
