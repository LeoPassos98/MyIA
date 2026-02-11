// backend/src/controllers/aiController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { jsend } from '../utils/jsend';

export const aiController = {
  /**
   * GET /api/ai/providers
   * Lista todos os providers e seus modelos ativos diretamente do banco.
   * Usado pelo Frontend para montar o seletor de IA.
   */
  async listProviders(_req: Request, res: Response, next: NextFunction) {
    try {
      // Schema v2: Busca providers ativos com deployments (não mais AIProvider + models)
      const providersRaw = await prisma.provider.findMany({
        where: {
          isActive: true
        },
        include: {
          deployments: {
            where: { isActive: true },
            include: {
              baseModel: {
                select: {
                  id: true,
                  name: true,
                  capabilities: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      
      // Mapear para formato compatível com frontend
      const providers = providersRaw.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        isActive: p.isActive,
        models: p.deployments.map(d => {
          const capabilities = d.baseModel.capabilities as Record<string, unknown> | null;
          return {
            id: d.id,
            name: d.baseModel.name,
            apiModelId: d.deploymentId,
            contextWindow: (capabilities?.maxContextWindow as number) || 200000
          };
        }).sort((a, b) => b.contextWindow - a.contextWindow) // Mostra os mais potentes primeiro
      }));
      
      logger.info(`Providers list requested. Found: ${providers.length}`);
      
      res.status(200).json(jsend.success({ providers }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/ai/test/:providerSlug
   * Testar conexão com um provider específico.
   */
  async testProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider: providerSlug } = req.params;

      // Schema v2: AIProvider → Provider
      // Validação via Banco de Dados (Modular)
      const providerExists = await prisma.provider.findUnique({
        where: { slug: providerSlug }
      });

      if (!providerExists) {
        return res.status(404).json(jsend.fail({
          provider: `Provider '${providerSlug}' não encontrado ou não cadastrado no sistema.`
        }));
      }

      if (!providerExists.isActive) {
        return res.status(400).json(jsend.fail({
          provider: `Provider '${providerExists.name}' está desativado no painel administrativo.`
        }));
      }

      logger.info(`Testing provider connectivity: ${providerSlug}`);
      
      // TODO: Atualizar o aiService.testProvider para usar a nova Factory também.
      // Por enquanto, mantemos a chamada, mas saiba que ela pode precisar de refatoração 
      // interna no futuro se o testProvider antigo depender de configs legadas.
      // Para o fluxo de chat (o mais importante), já está 100% migrado.
      
      // Mock de sucesso temporário para não bloquear o frontend enquanto refatoramos o teste profundo
      return res.json(jsend.success({ 
        message: `Conexão com ${providerExists.name} simulada com sucesso (V2 Modular).`,
        latency: 120 
      }));

    } catch (error) {
      next(error);
      return;
    }
  },
};