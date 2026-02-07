// backend/src/services/chat/orchestrator/handlers/ChatManager.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { PrismaClient, Chat } from '@prisma/client';

/**
 * Resultado da gestão de chat
 */
export interface ChatResult {
  chat: Chat;
  isNewChat: boolean;
}

/**
 * Gerenciador de chat
 * 
 * Responsabilidades:
 * - Criar novo chat
 * - Recuperar chat existente
 * - Validar permissões (userId)
 * - Aplicar provider padrão
 */
export class ChatManager {
  private readonly DEFAULT_PROVIDER = 'groq';

  constructor(private prisma: PrismaClient) {}

  /**
   * Obtém chat existente ou cria novo
   * 
   * @param userId - ID do usuário
   * @param chatId - ID do chat (opcional)
   * @param provider - Provider a usar (opcional, padrão: groq)
   * @returns Chat e flag indicando se é novo
   * @throws Error se chat não encontrado ou usuário sem permissão
   */
  async getOrCreate(
    userId: string,
    chatId?: string,
    provider?: string
  ): Promise<ChatResult> {
    // Se chatId fornecido, recupera existente
    if (chatId) {
      return await this.getExisting(userId, chatId);
    }

    // Caso contrário, cria novo
    return await this.createNew(userId, provider);
  }

  /**
   * Recupera chat existente
   * 
   * @param userId - ID do usuário
   * @param chatId - ID do chat
   * @returns Chat existente
   * @throws Error se chat não encontrado ou usuário sem permissão
   */
  private async getExisting(userId: string, chatId: string): Promise<ChatResult> {
    const chat = await this.prisma.chat.findUnique({
      where: {
        id: chatId,
        userId // Garante que usuário tem permissão
      }
    });

    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    return {
      chat,
      isNewChat: false
    };
  }

  /**
   * Cria novo chat
   * 
   * @param userId - ID do usuário
   * @param provider - Provider a usar (opcional)
   * @returns Chat criado
   */
  private async createNew(userId: string, provider?: string): Promise<ChatResult> {
    const chat = await this.prisma.chat.create({
      data: {
        userId,
        provider: provider || this.DEFAULT_PROVIDER
      }
    });

    return {
      chat,
      isNewChat: true
    };
  }
}
