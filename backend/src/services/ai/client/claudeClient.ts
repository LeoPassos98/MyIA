// backend/src/services/ai/client/claudeClient.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import axios from 'axios';
import { ChatMessage, AiServiceResponse, StreamChunk } from '../types';
import { getProviderConfig } from '../utils/providerUtils';

export async function callClaudeAPI(
  messages: ChatMessage[]
): Promise<AiServiceResponse> {
  const config = getProviderConfig('claude');
  
  if (!config.isValidKey || !config.apiKey) {
    throw new Error('Claude API key not configured');
  }

  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const claudeMessages = conversationMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  try {
    const response = await axios.post(
      `${config.baseURL}/messages`,
      {
        model: process.env.ANTHROPIC_MODEL || config.defaultModel,
        max_tokens: 1024,
        messages: claudeMessages,
        ...(systemMessage && { system: systemMessage }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    const responseData = response.data;
    const textResponse = responseData.content[0].text;
    const usage = responseData.usage;
    const modelUsed = responseData.model;

    const standardizedResponse: AiServiceResponse = {
      response: textResponse,
      tokensIn: usage.input_tokens || 0,
      tokensOut: usage.output_tokens || 0,
      model: modelUsed,
    };

    return standardizedResponse;

  } catch (error: unknown) {
    // Axios errors have a response property
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Claude API error: ${error.response.data?.error?.message || error.message}`);
    }
    throw error instanceof Error ? error : new Error('Unknown error');
  }
}

// A NOVA FUNÇÃO DE CHAT COM STREAMING (usando fetch nativo)
export async function* streamClaudeChat(
  messages: any[]
): AsyncGenerator<StreamChunk> {
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    yield { type: 'error', error: 'ANTHROPIC_API_KEY não configurada' };
    return;
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const convertedMessages = convertMessages(messages);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        messages: convertedMessages.messages,
        system: convertedMessages.system,
        stream: true, // <-- Habilita streaming
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield { type: 'error', error: `Claude API error: ${response.status} - ${errorText}` };
      return;
    }

    if (!response.body) {
      yield { type: 'error', error: 'Response body vazio do Claude' };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            // Claude envia chunks de conteúdo
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text || '';
              if (content) {
                yield { type: 'chunk', content };
              }
            }
            
            // Telemetria vem no evento 'message_stop'
            if (parsed.type === 'message_stop' && parsed.message?.usage) {
              inputTokens = parsed.message.usage.input_tokens || 0;
              outputTokens = parsed.message.usage.output_tokens || 0;
            }
          } catch (parseError) {
            console.warn('Erro ao parsear chunk do Claude:', parseError);
          }
        }
      }
    }

    // Calcular custo (valores hardcoded temporariamente)
    const costs = { input: 3, output: 15 }; // Claude Sonnet pricing per 1M tokens
    const totalCost = ((inputTokens / 1_000_000) * costs.input) + 
                      ((outputTokens / 1_000_000) * costs.output);

    // Enviar telemetria final
    yield { 
      type: 'telemetry', 
      metrics: {
        tokensIn: inputTokens,
        tokensOut: outputTokens,
        costInUSD: totalCost,
        model: model,
        provider: 'claude'
      }
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no stream Claude';
    console.error('Erro no stream (Claude):', error);
    yield { type: 'error', error: errorMessage };
  }
}

// Função não-streaming para compatibilidade
export async function chatClaude(
  messages: any[]
): Promise<{ response: string; tokensIn: number; tokensOut: number; model: string }> {
  let fullResponse = "";
  let metrics = { tokensIn: 0, tokensOut: 0, model: "", provider: "" };

  for await (const chunk of streamClaudeChat(messages)) {
    if (chunk.type === 'chunk') {
      fullResponse += chunk.content;
    } else if (chunk.type === 'telemetry') {
      metrics = chunk.metrics;
    } else if (chunk.type === 'error') {
      throw new Error(chunk.error);
    }
  }

  return {
    response: fullResponse,
    tokensIn: metrics.tokensIn,
    tokensOut: metrics.tokensOut,
    model: metrics.model
  };
}

function convertMessages(messages: any[]) {
  const systemMessage = messages.find((msg) => msg.role === 'system')?.content || '';
  const userMessages = messages.filter((msg) => msg.role === 'user');
  const assistantMessages = messages.filter((msg) => msg.role === 'assistant');

  const converted: any = {
    system: systemMessage,
    messages: [],
  };

  userMessages.forEach((msg, index) => {
    converted.messages.push({
      role: 'user',
      content: msg.content,
    });

    // Adiciona a resposta do assistente correspondente, se existir
    const assistantMsg = assistantMessages[index];
    if (assistantMsg) {
      converted.messages.push({
        role: 'assistant',
        content: assistantMsg.content,
      });
    }
  });

  return converted;
}