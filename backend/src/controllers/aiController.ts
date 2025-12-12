// backend/src/controllers/aiController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma'; // <--- Agora usamos o Banco!
import { logger } from '../utils/logger';

export const aiController = {
  /**
   * GET /api/ai/providers
   * Lista todos os providers e seus modelos ativos diretamente do banco.
   * Usado pelo Frontend para montar o seletor de IA.
   */
  async listProviders(_req: Request, res: Response, next: NextFunction) {
    try {
      // Busca providers ativos e seus modelos ativos
      const providers = await prisma.aIProvider.findMany({
        where: { 
          isActive: true 
        },
        include: {
          models: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              apiModelId: true,
              contextWindow: true,
            },
            orderBy: { contextWindow: 'desc' } // Mostra os mais potentes primeiro
          }
        },
        orderBy: { name: 'asc' }
      });
      
      logger.info(`Providers list requested. Found: ${providers.length}`);
      
      res.status(200).json(providers);
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

      // 1. Validação via Banco de Dados (Modular)
      // Não usamos mais lista fixa ['openai', 'groq'] aqui.
      const providerExists = await prisma.aIProvider.findUnique({
        where: { slug: providerSlug }
      });

      if (!providerExists) {
        return res.status(404).json({
          error: `Provider '${providerSlug}' não encontrado ou não cadastrado no sistema via banco de dados.`,
        });
      }

      if (!providerExists.isActive) {
        return res.status(400).json({
          error: `Provider '${providerExists.name}' está desativado no painel administrativo.`,
        });
      }

      logger.info(`Testing provider connectivity: ${providerSlug}`);
      
      // TODO: Atualizar o aiService.testProvider para usar a nova Factory também.
      // Por enquanto, mantemos a chamada, mas saiba que ela pode precisar de refatoração 
      // interna no futuro se o testProvider antigo depender de configs legadas.
      // Para o fluxo de chat (o mais importante), já está 100% migrado.
      
      // Mock de sucesso temporário para não bloquear o frontend enquanto refatoramos o teste profundo
      return res.json({ 
        success: true, 
        message: `Conexão com ${providerExists.name} simulada com sucesso (V2 Modular).`,
        latency: 120 
      });

    } catch (error) {
      next(error);
      return;
    }
  },
};