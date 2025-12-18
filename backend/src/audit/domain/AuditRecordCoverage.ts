// backend/src/audit/domain/AuditRecordCoverage.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

/**
 * AuditRecordCoverage
 *
 * Mapeamento oficial: AuditRecord ↔ Prisma
 *
 * content.assistantMessage → Message.content (role=assistant)
 * content.promptFinal     → Message.sentContext
 *
 * inference.provider      → Message.provider
 * inference.model         → Message.model
 * inference.strategy      → Message.sentContext (parse)
 * inference.parameters    → Message.sentContext (parse)
 *
 * usage.tokensIn          → Message.tokensIn
 * usage.tokensOut         → Message.tokensOut
 * usage.costInUSD         → Message.costInUSD
 * usage.bytesIn/out       → ApiCallLog.bytesIn/out (futuro)
 *
 * execution.status        → inferido no Builder
 * execution.error         → provider try/catch (futuro)
 *
 * NÃO auditável:
 * - Message.vector (embedding interno)
 */
export const AuditRecordCoverage = {};
  // ===============================

  provider: {
    source: 'Prisma.Message.provider';
    status: '✅ Persistido';
  };

  model: {
    source: 'Prisma.Message.model';
    status: '✅ Persistido';
  };

  // ===============================
  // Conteúdo
  // ===============================

  userPrompt: {
    source: 'Prisma.Message(role=user).content';
    status: '✅ Persistido';
  };

  assistantResponse: {
    source: 'Prisma.Message(role=assistant).content';
    status: '✅ Persistido';
  };

  rawPayloadSent: {
    source: 'Prisma.Message.sentContext.payloadSent_V23';
    status: '✅ Persistido';
    notes: 'JSON string — parse necessário';
  };

  // ===============================
  // Estratégia de Inferência
  // ===============================

  strategy: {
    source: 'Prisma.Message.sentContext.config_V47.strategy';
    status: '🧠 Inferido';
    notes: 'Extraído do JSON sentContext';
  };

  inferenceParams: {
    source: 'Prisma.Message.sentContext.config_V47.params';
    status: '🧠 Inferido';
    notes: 'temperature, topK, memoryWindow, etc';
  };

  // ===============================
  // Telemetria / Custos
  // ===============================

  tokensIn: {
    source: 'Prisma.Message.tokensIn';
    status: '✅ Persistido';
  };

  tokensOut: {
    source: 'Prisma.Message.tokensOut';
    status: '✅ Persistido';
  };

  costInUSD: {
    source: 'Prisma.Message.costInUSD';
    status: '✅ Persistido';
  };

  // ===============================
  // RAG / Vetores
  // ===============================

  vectorEmbeddingExists: {
    source: 'Prisma.Message.vector';
    status: '✅ Persistido';
    notes: 'Apenas o embedding, não o uso';
  };

  ragUsed: {
    source: 'runtime (strategy)';
    status: '🧠 Inferido';
    notes: 'Ex: strategy contém "rag"';
  };

  ragDocuments: {
    source: 'N/A';
    status: '❌ Não disponível';
    notes: 'Docs, chunks e scores não são persistidos';
  };

  ragScores: {
    source: 'N/A';
    status: '❌ Não disponível';
  };

  // ===============================
  // Erros / Execução
  // ===============================

  inferenceStatus: {
    source: 'runtime';
    status: '🧠 Inferido';
    notes: 'success | error | timeout';
  };

  errorMessage: {
    source: 'runtime / provider error';
    status: '🧠 Inferido';
  };

  retryCount: {
    source: 'N/A';
    status: '❌ Não disponível';
  };

  fallbackUsed: {
    source: 'N/A';
    status: '❌ Não disponível';
  };

  // ===============================
  // Governança / Políticas
  // ===============================

  policyDecisions: {
    source: 'N/A';
    status: '❌ Não disponível';
    notes: 'Bloqueios, sanitização, limites';
  };

  // ===============================
  // Explainability
  // ===============================

  explanation: {
    source: 'N/A';
    status: '❌ Não disponível';
    notes: 'Por que respondeu isso';
  };