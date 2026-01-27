// backend/src/services/ai/providers/factory.ts
// Standards: docs/STANDARDS.md

import { prisma } from '../../../lib/prisma';
import { BaseAIProvider } from './base';
import { OpenAIProvider } from './openai';
import crypto from 'crypto';
import logger from '../../../utils/logger';

function decryptApiKey(encryptedKey: string): string {
  const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
  if (!ENCRYPTION_SECRET) {
    throw new Error('ENCRYPTION_SECRET não configurado no .env');
  }

  const [ivHex, authTagHex, encryptedHex] = encryptedKey.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    return encryptedKey; // Plaintext fallback
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_SECRET, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class AIProviderFactory {
  
  /**
   * Retorna a instância do driver correto baseado no slug do banco de dados.
   * Ex: se slug="groq", retorna new OpenAIProvider("https://api.groq.com/openai/v1")
   */
  static async getProviderInstance(providerSlug: string): Promise<BaseAIProvider> {
    
    // 1. Busca configurações no banco
    const providerConfig = await prisma.aIProvider.findUnique({
      where: { slug: providerSlug },
    });

    if (!providerConfig) {
      throw new Error(`Provedor '${providerSlug}' não encontrado no banco de dados.`);
    }

    if (!providerConfig.isActive) {
      throw new Error(`O provedor '${providerConfig.name}' está temporariamente desativado.`);
    }

    // 2. Decide qual classe instanciar
    switch (providerSlug) {
      case 'openai':
        return new OpenAIProvider();

      case 'groq':
      case 'together':
      case 'mistral':
      case 'deepseek':
        if (!providerConfig.baseUrl) {
            throw new Error(`URL Base não configurada no banco para ${providerSlug}`);
        }
        return new OpenAIProvider(providerConfig.baseUrl);

      case 'bedrock':
      case 'aws': {
        const { BedrockProvider } = await import('./bedrock');
        const region = providerConfig.baseUrl || 'us-east-1';
        return new BedrockProvider(region);
      }

      case 'anthropic':
        throw new Error("Anthropic ainda não implementado na nova arquitetura.");

      default:
        throw new Error(`Driver não implementado para: ${providerSlug}`);
    }
  }

  static async getApiKey(userId: string, providerId: string): Promise<string> {
    // Buscar informações do provider
    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
      select: { slug: true }
    });

    if (!provider) throw new Error("Provider não encontrado.");

    // Caso especial: AWS Bedrock usa userSettings ao invés de userProviderCredential
    if (provider.slug === 'bedrock' || provider.slug === 'aws') {
      const { encryptionService } = await import('../../../services/encryptionService');
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { awsAccessKey: true, awsSecretKey: true, awsRegion: true }
      });

      if (settings?.awsAccessKey && settings?.awsSecretKey) {
        const accessKey = encryptionService.decrypt(settings.awsAccessKey);
        const secretKey = encryptionService.decrypt(settings.awsSecretKey);
        logger.info(`[Factory] Usando credenciais AWS do userSettings para usuário ${userId}`);
        return `${accessKey}:${secretKey}`;
      }
    }

    // Buscar na tabela userProviderCredential (outros providers)
    const userCred = await prisma.userProviderCredential.findUnique({
      where: { userId_providerId: { userId, providerId } }
    });

    if (userCred) {
      return decryptApiKey(userCred.apiKey);
    }

    // Fallback: .env system keys
    const envKeyMap: Record<string, string> = {
      'openai': process.env.OPENAI_API_KEY || '',
      'groq': process.env.GROQ_API_KEY || '',
      'anthropic': process.env.ANTHROPIC_API_KEY || '',
      'together': process.env.TOGETHER_API_KEY || '',
      'perplexity': process.env.PERPLEXITY_API_KEY || '',
      'mistral': process.env.MISTRAL_API_KEY || '',
      'bedrock': process.env.AWS_BEDROCK_CREDENTIALS || '',
      'aws': process.env.AWS_BEDROCK_CREDENTIALS || '',
    };

    const systemKey = envKeyMap[provider.slug];
    if (systemKey) {
      logger.info(`[Factory] Usando chave do sistema (.env) para ${provider.slug}`);
      return systemKey;
    }
    
    throw new Error(`Chave de API não configurada para ${provider.slug}. Configure em Settings ou no .env`);
  }
}
