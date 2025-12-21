// backend/src/controllers/auditController.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuditRecordBuilder } from '../audit';
import { logger } from '../utils/logger';

class AuditController {
  /**
   * GET /api/audit/messages
   * 
   * Retorna lista paginada de registros de auditoria do usuário
   * Suporta filtros: provider, model, dateFrom, dateTo
   * Suporta ordenação: cost, tokens, timestamp
   */
  async listAudits(req: Request, res: Response) {
    const userId = req.userId;
    const { 
      provider, 
      model, 
      dateFrom, 
      dateTo, 
      orderBy = 'timestamp', 
      order = 'desc',
      limit = '50'
    } = req.query;

    try {
      // Construir filtros
      const where: any = {
        chat: { userId },
        role: 'assistant', // Somente respostas da IA têm métricas
        NOT: {
          tokensIn: null, // Filtra mensagens sem métricas
        },
      };

      if (provider) where.provider = provider;
      if (model) where.model = model;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
        if (dateTo) where.createdAt.lte = new Date(dateTo as string);
      }

      // Construir ordenação
      const orderByClause: any = {};
      if (orderBy === 'cost') orderByClause.costInUSD = order;
      else if (orderBy === 'tokens') orderByClause.tokensOut = order;
      else orderByClause.createdAt = order;

      // Buscar mensagens
      const messages = await prisma.message.findMany({
        where,
        orderBy: orderByClause,
        take: parseInt(limit as string),
        include: {
          chat: true,
        },
      });

      // Construir AuditRecords
      const auditRecords = messages.map(message =>
        AuditRecordBuilder.build({ message, userId: userId! })
      );

      return res.json(auditRecords);
    } catch (error) {
      logger.error('Erro ao listar auditorias', error);
      return res.status(500).json({ error: 'Erro ao listar auditorias' });
    }
  }

  /**
   * GET /api/audit/messages/:messageId
   *
   * Retorna um AuditRecord para uma mensagem específica
   * - Garante que a mensagem pertence ao usuário autenticado
   * - Não inventa dados ausentes (undefined é válido)
   */
  async getAuditByMessageId(req: Request, res: Response) {
    const { messageId } = req.params;
    const userId = req.userId; // vem do authMiddleware

    if (!messageId) {
      return res.status(400).json({ error: 'messageId é obrigatório' });
    }

    try {
      // 1️⃣ Buscar mensagem + chat
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          chat: true,
        },
      });

      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      // 2️⃣ Garantir ownership
      if (message.chat.userId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // 3️⃣ Construir AuditRecord
      const auditRecord = AuditRecordBuilder.build({
        message,
        userId,
      });

      // 4️⃣ Retornar auditoria
      return res.json(auditRecord);
    } catch (error) {
      logger.error('Erro ao gerar auditoria', error);
      return res.status(500).json({ error: 'Erro interno ao gerar auditoria' });
    }
  }
}

export const auditController = new AuditController();
