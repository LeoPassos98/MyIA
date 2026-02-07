// backend/src/services/providers/provider-filter.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import logger from '../../utils/logger';
import { Provider } from '../../types/providers';

/**
 * Service para filtragem de providers configurados pelo usuário
 * Responsabilidade: Buscar e filtrar providers baseado em configurações do usuário
 */
export class ProviderFilterService {
  /**
   * Busca providers configurados para o usuário
   * - Busca configurações do usuário
   * - Busca validação AWS
   * - Busca providers ativos
   * - Filtra por configuração
   * - Cria modelos dinâmicos (AWS)
   * 
   * @param userId - ID do usuário
   * @param requestId - ID da requisição (para logging)
   * @returns Lista de providers configurados
   */
  async getConfiguredProviders(userId: string, requestId?: string): Promise<Provider[]> {
    logger.debug('Buscando providers configurados', {
      requestId,
      userId
    });

    // 1. Buscar configurações do usuário
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // 2. Buscar validação AWS
    const awsValidation = await prisma.providerCredentialValidation.findUnique({
      where: { userId_provider: { userId, provider: 'bedrock' } }
    });

    // 3. Buscar todos os providers ativos
    const allProviders = await prisma.aIProvider.findMany({
      where: { isActive: true },
      include: {
        models: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      }
    });

    logger.debug('Providers encontrados', {
      requestId,
      totalProviders: allProviders.length,
      awsEnabledModels: settings?.awsEnabledModels?.length || 0,
      awsValidationStatus: awsValidation?.status
    });

    // 4. Filtrar providers baseado em configuração
    const filteredProviders = allProviders.filter(provider => {
      // Providers padrão (sempre disponíveis)
      if (['openai', 'groq', 'together'].includes(provider.slug)) {
        return true;
      }

      // AWS Bedrock: só mostrar se validado E com modelos habilitados
      if (provider.slug === 'bedrock') {
        return this.filterAWSProvider(provider, settings, awsValidation, requestId);
      }

      return true;
    });

    logger.debug('Providers filtrados', {
      requestId,
      totalFiltered: filteredProviders.length,
      providerSlugs: filteredProviders.map(p => p.slug)
    });

    return filteredProviders as Provider[];
  }

  /**
   * Filtra provider AWS baseado em validação e modelos habilitados
   *
   * @param provider - Provider AWS
   * @param settings - Configurações do usuário
   * @param awsValidation - Validação AWS
   * @param requestId - ID da requisição
   * @returns true se provider deve ser incluído
   */
  private filterAWSProvider(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: any,
    settings: { awsEnabledModels?: string[] } | null,
    awsValidation: { status?: string } | null,
    requestId?: string
  ): boolean {
    if (awsValidation?.status === 'valid' && settings?.awsEnabledModels?.length) {
      // Filtrar apenas modelos habilitados pelo usuário
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingModels = provider.models.filter((m: any) =>
        settings.awsEnabledModels!.includes(m.apiModelId)
      );

      // Criar modelos dinâmicos para IDs que não existem no banco
      const dynamicModels = this.createDynamicModels(
        provider,
        settings.awsEnabledModels!,
        requestId
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider.models = [...existingModels, ...dynamicModels] as any;

      logger.debug('Bedrock modelos filtrados', {
        requestId,
        totalModels: provider.models.length,
        existingModels: existingModels.length,
        dynamicModels: dynamicModels.length
      });

      return provider.models.length > 0;
    }

    logger.debug('Bedrock excluído: não validado ou sem modelos habilitados', {
      requestId,
      validationStatus: awsValidation?.status,
      enabledModelsCount: settings?.awsEnabledModels?.length || 0
    });

    return false;
  }

  /**
   * Cria modelos dinâmicos para IDs não cadastrados no banco
   * 
   * @param provider - Provider AWS
   * @param enabledModelIds - IDs de modelos habilitados
   * @param requestId - ID da requisição
   * @returns Lista de modelos dinâmicos
   */
  private createDynamicModels(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: any,
    enabledModelIds: string[],
    requestId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any[] {
    const missingModelIds = enabledModelIds.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (modelId: string) => !provider.models.some((m: any) => m.apiModelId === modelId)
    );

    if (missingModelIds.length > 0) {
      logger.warn('Criando modelos dinâmicos (não cadastrados no banco)', {
        requestId,
        missingModelIds,
        count: missingModelIds.length
      });
    }

    return missingModelIds.map((apiModelId: string) => ({
      id: `dynamic-${apiModelId}`,
      name: apiModelId.split('.').pop()?.replace(/-/g, ' ').toUpperCase() || apiModelId,
      apiModelId,
      contextWindow: 200000,
      costPer1kInput: 0,
      costPer1kOutput: 0,
      isActive: true,
      providerId: provider.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }
}
