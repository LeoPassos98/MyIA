import { logger } from '../utils/logger';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatContext {
  userId: string;
  messages: Message[];
  lastActivity: Date;
}

const MAX_MESSAGES = parseInt(process.env.MAX_CONTEXT_MESSAGES || '15');
const CLEANUP_INTERVAL = parseInt(process.env.CONTEXT_CLEANUP_INTERVAL || '3600000');

class ContextService {
  private contexts: Map<string, ChatContext>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.contexts = new Map();
    this.startCleanupTask();
    logger.info('ContextService initialized');
  }

  addMessage(userId: string, role: 'user' | 'assistant', content: string): void {
    let context = this.contexts.get(userId);

    if (!context) {
      context = {
        userId,
        messages: [],
        lastActivity: new Date(),
      };
      this.contexts.set(userId, context);
    }

    context.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Manter apenas as últimas N mensagens
    if (context.messages.length > MAX_MESSAGES) {
      context.messages = context.messages.slice(-MAX_MESSAGES);
    }

    context.lastActivity = new Date();
  }

  getMessages(userId: string): Message[] {
    const context = this.contexts.get(userId);
    return context ? context.messages : [];
  }

  clearContext(userId: string): void {
    this.contexts.delete(userId);
    logger.info(`Context cleared for user: ${userId}`);
  }

  getContextSize(userId: string): number {
    return this.getMessages(userId).length;
  }

  stopCleanupTask(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private startCleanupTask(): void {
    this.cleanupTimer = setInterval(() => {
      const now = new Date();
      let cleaned = 0;

      this.contexts.forEach((context, userId) => {
        const inactiveTime = now.getTime() - context.lastActivity.getTime();
        
        // Remove contextos inativos há mais de 1 hora
        if (inactiveTime > CLEANUP_INTERVAL) {
          this.contexts.delete(userId);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        logger.info(`Cleaned ${cleaned} inactive contexts`);
      }
    }, CLEANUP_INTERVAL);
  }
}

export const contextService = new ContextService();