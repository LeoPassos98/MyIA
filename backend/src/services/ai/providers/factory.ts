// backend/src/services/ai/providers/factory.ts
// Standards: docs/STANDARDS.md

import { prisma } from '../../../lib/prisma';
import { BaseAIProvider } from './base';
import { OpenAIProvider } from './openai';

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
        return new OpenAIProvider(); // URL padrão da OpenAI

      case 'groq':
      case 'together':
      case 'mistral':
      case 'deepseek': // Futuro
        // Estes usam a mesma lib da OpenAI, mas com URL base diferente
        if (!providerConfig.baseUrl) {
            throw new Error(`URL Base não configurada no banco para ${providerSlug}`);
        }
        return new OpenAIProvider(providerConfig.baseUrl);

      case 'anthropic':
        // return new AnthropicProvider(); // Implementaremos depois
        throw new Error("Anthropic ainda não implementado na nova arquitetura.");

      default:
        throw new Error(`Driver não implementado para: ${providerSlug}`);
    }
  }

  /**
   * Recupera a chave de API do usuário (BYOK) ou do sistema.
   */
  static async getApiKey(userId: string, providerId: string): Promise<string> {
    // 1. Tenta buscar credencial específica do usuário
    const userCred = await prisma.userProviderCredential.findUnique({
      where: {
        userId_providerId: {
          userId,
          providerId
        }
      }
    });

    if (userCred) return userCred.apiKey;

    // TODO: Aqui poderíamos implementar um fallback para uma chave "global" do sistema
    // se o seu modelo de negócio permitir uso gratuito limitado.
    
    throw new Error("Chave de API não configurada para este provedor.");
  }
}
