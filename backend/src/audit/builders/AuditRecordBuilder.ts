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

    // Derivar dataOrigin de sentContext.meta.isSynthetic quando existir
    const isSynthetic = parsedContext?.meta?.isSynthetic === true;
    const dataOrigin = isSynthetic ? 'synthetic' : 'real';

    // Extrair strategy de config_V47
    const strategy = parsedContext?.config_V47?.strategy ?? undefined;

    // Extrair parameters de config_V47.params
    const parameters = parsedContext?.config_V47?.params ?? undefined;

    // Calcular totalTokens sempre (soma ou 0)
    const tokensIn = message.tokensIn ?? undefined;
    const tokensOut = message.tokensOut ?? undefined;
    const totalTokens = (tokensIn ?? 0) + (tokensOut ?? 0);

    // Extrair latencyMs de metrics
    const latencyMs = parsedContext?.metrics?.latencyMs ?? undefined;

    return {
      schemaVersion: 'audit.v1.4',

      auditId: randomUUID(),
      messageId: message.id,
      chatId: message.chatId,
      userId,
      timestamp: message.createdAt,
      source: 'chat',
      dataOrigin,

      content: {
        assistantMessage: message.role === 'assistant' ? message.content : undefined,
      },

      inference: {
        provider: message.provider ?? undefined,
        model: message.model ?? undefined,
        strategy,
        parameters,
      },

      usage: {
        tokensIn,
        tokensOut,
        totalTokens,
        costInUSD: message.costInUSD ?? undefined,
        // bytesIn / bytesOut virão do ApiCallLog no futuro
      },

      execution: {
        status: 'success',
        latencyMs,
      },
    };
  }
}
