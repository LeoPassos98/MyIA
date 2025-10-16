// backend/src/services/ai/utils/errorMessages.ts

import { ProviderName, ProviderConfig } from '../types';

export function getMockResponseMessage(provider: ProviderName, config: ProviderConfig): string {
  return `🤖 Esta é uma resposta mock. Configure a chave da API ${provider.toUpperCase()} no arquivo .env para usar IA real.\n\n` +
         `💡 Variável necessária: ${config.keyEnv}\n` +
         `💡 Dica: Groq e Together.ai são gratuitos!`;
}

export function getQuotaExceededMessage(provider: ProviderName): string {
  return `⚠️ A cota da API ${provider.toUpperCase()} foi excedida.\n\n` +
         `💡 Solução: Use uma API gratuita!\n` +
         `• Groq: https://console.groq.com (100% gratuito)\n` +
         `• Together.ai: https://together.ai ($25 de crédito grátis)\n` +
         `• Perplexity: https://docs.perplexity.ai ($5 de crédito grátis)`;
}

export function getInvalidKeyMessage(provider: ProviderName, keyEnv: string): string {
  return `🔑 A chave da API ${provider.toUpperCase()} está inválida ou expirada.\n\n` +
         `Verifique sua chave e a variável de ambiente: ${keyEnv}`;
}

export function getRateLimitMessage(): string {
  return '⏱️ Muitas requisições em pouco tempo. Aguarde alguns segundos e tente novamente.';
}