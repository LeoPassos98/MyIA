// backend/src/audit/builders/AuditRecordBuilder.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { randomUUID } from 'crypto';
import { AuditRecord } from '../domain/AuditRecord';

interface BuildAuditRecordInput {
  message: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
    chatId: string;
    provider?: string | null;
    model?: string | null;
    tokensIn?: number | null;
    tokensOut?: number | null;
    costInUSD?: number | null;
    sentContext?: string | null;
  };
  userId: string;
}

export class AuditRecordBuilder {
  static build(input: BuildAuditRecordInput): AuditRecord {
    const { message, userId } = input;

    // Parse defensivo do sentContext (fonte oficial)
    let parsedContext: any = {};
    if (message.sentContext) {
      try {
        parsedContext = JSON.parse(message.sentContext);
      } catch {
        parsedContext = {};
      }
    }

    return {
      auditId: randomUUID(),

      messageId: message.id,
      chatId: message.chatId,
      userId,
      timestamp: message.createdAt,
      source: 'chat',

      content: {
        assistantMessage: message.role === 'assistant' ? message.content : undefined,
        promptFinal: message.sentContext ?? undefined,
      },

      inference: {
        provider: message.provider ?? undefined,
        model: message.model ?? undefined,
        strategy: parsedContext?.strategy,
        parameters: parsedContext?.parameters,
      },

      usage: {
        tokensIn: message.tokensIn ?? undefined,
        tokensOut: message.tokensOut ?? undefined,
        costInUSD: message.costInUSD ?? undefined,
        // bytesIn / bytesOut virão do ApiCallLog no futuro
      },

      execution: {
        status: 'success',
      },
    };
  }
}
