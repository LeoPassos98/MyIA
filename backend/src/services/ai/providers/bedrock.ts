// backend/src/services/ai/providers/bedrock.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock'; // Adicionado
import { BaseAIProvider, AIRequestOptions } from './base';
import { StreamChunk } from '../types';

export class BedrockProvider extends BaseAIProvider {
  private region: string;

  constructor(region: string = 'us-east-1') {
    super();
    this.region = region;
  }

  async *streamChat(
    messages: any[],
    options: AIRequestOptions
  ): AsyncGenerator<StreamChunk> {
    const [accessKeyId, secretAccessKey] = options.apiKey.split(':');

    if (!accessKeyId || !secretAccessKey) {
      yield {
        type: 'error',
        error: 'AWS credentials must be in format: ACCESS_KEY:SECRET_KEY',
      };
      return;
    }

    const client = new BedrockRuntimeClient({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });

    try {
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const payload: any = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: options.maxTokens || 2048,
        messages: conversationMessages,
        temperature: options.temperature || 0.7,
        top_k: options.topK || 250,
        top_p: 0.999,
      };

      if (systemMessage) {
        payload.system = systemMessage.content;
      }

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: options.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);

      if (!response.body) {
        yield { type: 'error', error: 'No response body from Bedrock' };
        return;
      }

      for await (const event of response.body) {
        if (event.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

          if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
            yield { type: 'chunk', content: chunk.delta.text };
          }

          if (chunk.type === 'message_stop') {
            break;
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no AWS Bedrock';
      console.error(`[BedrockProvider] Erro no stream:`, error);
      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  }

  async validateKey(apiKey: string): Promise<boolean> {
    const [accessKeyId, secretAccessKey] = apiKey.split(':');
    if (!accessKeyId || !secretAccessKey) return false;

    try {
      const client = new BedrockClient({
        region: this.region,
        credentials: { accessKeyId, secretAccessKey },
      });

      // Dry run real: ListFoundationModelsCommand
      await client.send(new ListFoundationModelsCommand({}));
      return true;
    } catch {
      return false;
    }
  }

  // Novo método para obter contagem de modelos (usado na validação)
  async getModelsCount(apiKey: string): Promise<number> {
    const [accessKeyId, secretAccessKey] = apiKey.split(':');
    const client = new BedrockClient({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const response = await client.send(new ListFoundationModelsCommand({}));
    return response.modelSummaries?.length || 0;
  }
}
