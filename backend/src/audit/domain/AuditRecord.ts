// backend/src/audit/domain/AuditRecord.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

export type AuditStatus = 'success' | 'error';

export interface AuditRecord {
  // Identidade
  auditId: string;
  messageId: string;
  chatId: string;
  userId: string;
  timestamp: Date;
  source: 'chat' | 'system';

  // Conteúdo auditável
  content: {
    userMessage?: string;
    assistantMessage?: string;
    promptFinal?: string;
  };

  // Decisões de inferência
  inference: {
    provider?: string;
    model?: string;
    strategy?: string;
    parameters?: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    };
  };

  // Custos e impacto
  usage: {
    tokensIn?: number;
    tokensOut?: number;
    costInUSD?: number;
    bytesIn?: number;   // opcional, mas previsto
    bytesOut?: number;  // opcional, mas previsto
  };

  // Execução
  execution: {
    status: AuditStatus;
    error?: {
      code?: string;
      message?: string;
    };
  };
}
