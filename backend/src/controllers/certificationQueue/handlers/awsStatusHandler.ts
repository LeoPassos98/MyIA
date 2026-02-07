// backend/src/controllers/certificationQueue/handlers/awsStatusHandler.ts
// Standards: docs/STANDARDS.md

import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { logger } from '../../../utils/logger';

/**
 * Resultado da verificação de status AWS
 */
export interface AWSStatusResult {
  configured: boolean;
  valid: boolean;
  message: string;
  region: string | null;
  modelsAvailable: number;
  accessKeyPreview?: string;
  error?: string;
}

/**
 * Handler para verificação de status AWS
 * 
 * Responsabilidades:
 * - Verificar se credenciais AWS estão configuradas
 * - Validar credenciais fazendo chamada real à AWS
 * - Contar modelos disponíveis
 * - Fornecer informações de diagnóstico
 */
export class AWSStatusHandler {
  /**
   * Verifica status completo das credenciais AWS
   * 
   * @returns Resultado da verificação
   */
  async checkAWSCredentials(): Promise<AWSStatusResult> {
    logger.info('[AWSStatusHandler] Verificando credenciais AWS');

    const credentials = process.env.AWS_BEDROCK_CREDENTIALS;
    const region = process.env.AWS_BEDROCK_REGION || 'us-east-1';

    // Verificar se credenciais estão configuradas
    if (!credentials) {
      logger.warn('[AWSStatusHandler] AWS_BEDROCK_CREDENTIALS não configurado');
      return {
        configured: false,
        valid: false,
        message: 'AWS_BEDROCK_CREDENTIALS não configurado no .env',
        region: null,
        modelsAvailable: 0
      };
    }

    // Parsear credenciais (formato: ACCESS_KEY:SECRET_KEY)
    const parts = credentials.split(':');
    if (parts.length !== 2) {
      logger.warn('[AWSStatusHandler] Formato inválido de credenciais', {
        partsCount: parts.length
      });
      return {
        configured: true,
        valid: false,
        message: 'Formato inválido de AWS_BEDROCK_CREDENTIALS (esperado: ACCESS_KEY:SECRET_KEY)',
        region,
        modelsAvailable: 0
      };
    }

    const [accessKeyId, secretAccessKey] = parts;

    // Validar credenciais fazendo chamada real à AWS
    return await this.validateAWSConnection(accessKeyId, secretAccessKey, region);
  }

  /**
   * Valida conexão AWS fazendo chamada real
   * 
   * @param accessKeyId - AWS Access Key ID
   * @param secretAccessKey - AWS Secret Access Key
   * @param region - AWS Region
   * @returns Resultado da validação
   */
  async validateAWSConnection(
    accessKeyId: string,
    secretAccessKey: string,
    region: string
  ): Promise<AWSStatusResult> {
    logger.debug('[AWSStatusHandler] Validando conexão AWS', {
      region,
      accessKeyPreview: accessKeyId.substring(0, 8) + '...'
    });

    try {
      const client = new BedrockClient({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });

      const response = await client.send(new ListFoundationModelsCommand({}));
      const modelsAvailable = response.modelSummaries?.length || 0;

      logger.info('[AWSStatusHandler] Credenciais AWS válidas', {
        region,
        modelsAvailable
      });

      return {
        configured: true,
        valid: true,
        message: `Credenciais AWS válidas! ${modelsAvailable} modelos disponíveis.`,
        region,
        modelsAvailable,
        accessKeyPreview: accessKeyId.substring(0, 8) + '...'
      };
    } catch (awsError: any) {
      logger.error('[AWSStatusHandler] Falha na validação de credenciais AWS', {
        errorMessage: awsError.message,
        errorName: awsError.name,
        errorCode: awsError.code
      });

      return {
        configured: true,
        valid: false,
        message: `Erro ao validar credenciais: ${awsError.message}`,
        region,
        modelsAvailable: 0,
        error: awsError.name
      };
    }
  }

  /**
   * Obtém contagem de modelos disponíveis
   * 
   * @param client - Cliente Bedrock configurado
   * @returns Número de modelos disponíveis
   */
  async getAWSModelsCount(client: BedrockClient): Promise<number> {
    try {
      const response = await client.send(new ListFoundationModelsCommand({}));
      return response.modelSummaries?.length || 0;
    } catch (error: any) {
      logger.error('[AWSStatusHandler] Erro ao contar modelos', {
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Verifica se credenciais estão configuradas (sem validar)
   * 
   * @returns true se credenciais estão configuradas
   */
  areCredentialsConfigured(): boolean {
    return !!process.env.AWS_BEDROCK_CREDENTIALS;
  }

  /**
   * Obtém região configurada
   * 
   * @returns Região AWS configurada
   */
  getConfiguredRegion(): string {
    return process.env.AWS_BEDROCK_REGION || 'us-east-1';
  }

  /**
   * Parseia credenciais do ambiente
   * 
   * @returns Credenciais parseadas ou null se inválidas
   */
  parseCredentials(): { accessKeyId: string; secretAccessKey: string } | null {
    const credentials = process.env.AWS_BEDROCK_CREDENTIALS;
    
    if (!credentials) {
      return null;
    }

    const parts = credentials.split(':');
    if (parts.length !== 2) {
      return null;
    }

    const [accessKeyId, secretAccessKey] = parts;
    return { accessKeyId, secretAccessKey };
  }
}

// Exportar instância singleton
export const awsStatusHandler = new AWSStatusHandler();
