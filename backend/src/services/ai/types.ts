// backend/src/services/ai/types.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProviderConfig {
  baseURL: string;
  keyEnv: string;
  defaultModel: string;
}

export type ProviderName = 'openai' | 'groq' | 'together' | 'perplexity' | 'mistral' | 'claude';

export interface ProviderInfo {
  name: string;
  configured: boolean;
  model: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

// O "pacote" final de telemetria
export interface TelemetryMetrics {
  tokensIn: number;
  tokensOut: number;
  costInUSD: number;
  model: string;
  provider: string;
  chatId?: string; // ID do chat para atualização do frontend
  messageId?: string; // ID real da mensagem salva (Fonte Única de Verdade)
  sentContext?: string; // JSON serializado do contexto enviado
}

// O "protocolo" do gotejamento. Cada 'yield' será um destes.
export type StreamChunk = 
  | { type: 'chunk'; content: string } // Pedaço de texto
  | { type: 'telemetry'; metrics: TelemetryMetrics } // O recibo final
  | { type: 'error'; error: string } // Se algo der errado
  | { type: 'debug'; log: string } // <-- A "CÂMERA DE SEGURANÇA"
  | { type: 'user_message_saved'; userMessageId: string }; // ID real da msg do user

// Manter AiServiceResponse para compatibilidade com código não-streaming
export interface AiServiceResponse {
  response: string;
  tokensIn: number;
  tokensOut: number;
  model?: string;
}