// backend/src/services/providers/aws-credentials.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import { encryptionService } from '../encryptionService';
import { BedrockProvider } from '../ai/providers/bedrock';
import logger from '../../utils/logger';
import { 
  BedrockConfig, 
  AWSCredentials, 
  ValidationResult 
} from '../../types/providers';

/**
 * Service para gerenciamento de credenciais AWS Bedrock
 * Responsabilidade: Validação, criptografia e persistência de credenciais
 */
export class AWSCredentialsService {
  /**
   * Valida credenciais AWS Bedrock
   * - Resolve credenciais (stored vs. novas)
   * - Descriptografa credenciais
   * - Valida via AWS SDK
   * - Persiste se válidas
   * - Registra validação
   * 
   * @param userId - ID do usuário
   * @param config - Configuração AWS
   * @param requestId - ID da requisição (para logging)
   * @returns Resultado da validação
   */
  async validateCredentials(
    userId: string,
    config: BedrockConfig,
    requestId?: string
  ): Promise<ValidationResult> {
    logger.info('Iniciando validação AWS Bedrock', {
      requestId,
      userId,
      hasAccessKey: !!config.accessKey,
      hasSecretKey: !!config.secretKey,
      region: config.region,
      useStoredCredentials: config.useStoredCredentials
    });

    // 1. Resolver credenciais (stored vs. novas)
    const credentials = await this.resolveCredentials(userId, config, requestId);

    // 2. Validar via AWS SDK
    const startTime = Date.now();
    let latencyMs: number;
    let modelsCount: number;

    try {
      const bedrockProvider = new BedrockProvider(config.region);
      const apiKey = `${credentials.accessKey}:${credentials.secretKey}`;

      // Validar credenciais
      const isValid = await bedrockProvider.validateKey(apiKey);
      if (!isValid) {
        throw new Error('Credenciais inválidas ou sem permissão no Bedrock');
      }

      // Obter contagem de modelos
      modelsCount = await bedrockProvider.getModelsCount(apiKey);
      latencyMs = Date.now() - startTime;

      logger.info('AWS Bedrock validation success', {
        requestId,
        userId,
        region: config.region,
        modelsCount,
        latencyMs
      });

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido na validação';
      latencyMs = Date.now() - startTime;

      logger.warn('AWS Bedrock validation failed', {
        requestId,
        userId,
        region: config.region,
        error: errorMsg,
        latencyMs
      });

      // Registrar validação falha
      await this.recordValidation(userId, {
        status: 'invalid',
        message: this.mapErrorMessage(error),
        latencyMs,
        modelsCount: 0,
        error: errorMsg
      }, requestId);

      throw error;
    }

    // 3. Persistir credenciais se novas foram enviadas
    if (config.secretKey) {
      await this.saveCredentials(userId, credentials, requestId);
    }

    // 4. Registrar validação bem-sucedida
    await this.recordValidation(userId, {
      status: 'valid',
      message: `Credenciais válidas. ${modelsCount} modelos disponíveis.`,
      latencyMs,
      modelsCount
    }, requestId);

    return {
      status: 'valid',
      message: `Credenciais válidas. ${modelsCount} modelos disponíveis.`,
      latencyMs,
      modelsCount
    };
  }

  /**
   * Recupera credenciais descriptografadas do usuário
   * 
   * @param userId - ID do usuário
   * @param requestId - ID da requisição
   * @returns Credenciais descriptografadas ou null
   */
  async getDecryptedCredentials(
    userId: string,
    requestId?: string
  ): Promise<AWSCredentials | null> {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { awsAccessKey: true, awsSecretKey: true, awsRegion: true }
    });

    if (!userSettings?.awsAccessKey || !userSettings?.awsSecretKey) {
      logger.warn('Credenciais AWS não encontradas', {
        requestId,
        userId
      });
      return null;
    }

    return {
      accessKey: encryptionService.decrypt(userSettings.awsAccessKey),
      secretKey: encryptionService.decrypt(userSettings.awsSecretKey),
      region: userSettings.awsRegion || 'us-east-1'
    };
  }

  /**
   * Resolve credenciais (stored vs. novas)
   * 
   * @param userId - ID do usuário
   * @param config - Configuração AWS
   * @param requestId - ID da requisição
   * @returns Credenciais resolvidas
   */
  private async resolveCredentials(
    userId: string,
    config: BedrockConfig,
    requestId?: string
  ): Promise<AWSCredentials> {
    // Caso A: Edição - Usar credenciais enviadas
    if (config.secretKey) {
      logger.debug('Usando credenciais fornecidas', { requestId, userId });
      return {
        accessKey: config.accessKey!,
        secretKey: config.secretKey,
        region: config.region
      };
    }

    // Caso B: Teste Rápido - Buscar credenciais salvas
    logger.debug('Buscando credenciais salvas', { requestId, userId });
    const stored = await this.getDecryptedCredentials(userId, requestId);

    if (!stored) {
      throw new Error('Nenhuma credencial AWS salva. Forneça accessKey e secretKey.');
    }

    return stored;
  }

  /**
   * Persiste credenciais criptografadas
   * 
   * @param userId - ID do usuário
   * @param credentials - Credenciais a serem salvas
   * @param requestId - ID da requisição
   */
  private async saveCredentials(
    userId: string,
    credentials: AWSCredentials,
    requestId?: string
  ): Promise<void> {
    logger.info('Salvando credenciais AWS', {
      requestId,
      userId,
      region: credentials.region
    });

    await prisma.userSettings.upsert({
      where: { userId },
      update: {
        awsAccessKey: encryptionService.encrypt(credentials.accessKey),
        awsSecretKey: encryptionService.encrypt(credentials.secretKey),
        awsRegion: credentials.region
      },
      create: {
        userId,
        awsAccessKey: encryptionService.encrypt(credentials.accessKey),
        awsSecretKey: encryptionService.encrypt(credentials.secretKey),
        awsRegion: credentials.region
      }
    });
  }

  /**
   * Registra resultado da validação
   * 
   * @param userId - ID do usuário
   * @param result - Resultado da validação
   * @param requestId - ID da requisição
   */
  private async recordValidation(
    userId: string,
    result: ValidationResult,
    requestId?: string
  ): Promise<void> {
    logger.debug('Registrando validação', {
      requestId,
      userId,
      status: result.status
    });

    await prisma.providerCredentialValidation.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'bedrock'
        }
      },
      update: {
        status: result.status,
        lastValidatedAt: new Date(),
        latencyMs: result.latencyMs,
        lastError: result.error || null,
        errorCode: result.error ? 'VALIDATION_FAILED' : null
      },
      create: {
        userId,
        provider: 'bedrock',
        status: result.status,
        lastValidatedAt: new Date(),
        latencyMs: result.latencyMs,
        lastError: result.error || null,
        errorCode: result.error ? 'VALIDATION_FAILED' : null
      }
    });
  }

  /**
   * Mapeia erros AWS para mensagens amigáveis
   *
   * @param error - Erro da AWS
   * @returns Mensagem amigável
   */
  private mapErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name;
      if (errorName === 'UnrecognizedClientException') {
        return 'Credenciais AWS inválidas';
      }
      if (errorName === 'AccessDeniedException') {
        return 'Sem permissão para acessar Bedrock nesta região';
      }
      if (errorName === 'ThrottlingException') {
        return 'Limite de requisições atingido';
      }
    }
    return 'Credenciais inválidas';
  }
}
