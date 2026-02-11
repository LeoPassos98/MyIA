// backend/src/__tests__/integration/services/capabilityValidation.integration.test.ts
// Standards: docs/STANDARDS.md

import { PrismaClient } from '@prisma/client';
import { capabilityValidationService, ModelCapabilities } from '../../../services/models/capabilityValidationService';
import { modelCacheService } from '../../../services/models/modelCacheService';

// ============================================================================
// TEST SETUP
// ============================================================================

const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error']
});

/**
 * Cria um modelo base de teste com capabilities específicas
 */
async function createTestModel(
  name: string,
  capabilities: ModelCapabilities
): Promise<{ id: string; name: string }> {
  const model = await prisma.baseModel.create({
    data: {
      name,
      vendor: 'Test Vendor',
      family: 'Test Family',
      version: '1.0',
      capabilities: capabilities as object,
      deprecated: false
    }
  });
  return { id: model.id, name: model.name };
}

/**
 * Limpa dados de teste
 */
async function cleanupTestData(): Promise<void> {
  await prisma.modelDeployment.deleteMany({
    where: { deploymentId: { startsWith: 'test-cap-' } }
  });
  await prisma.baseModel.deleteMany({
    where: { name: { startsWith: 'Test Cap ' } }
  });
}

// ============================================================================
// TEST SUITE: CapabilityValidationService
// ============================================================================

describe('CapabilityValidationService - Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
    // Limpar cache antes dos testes
    modelCacheService.invalidateAll();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  afterEach(() => {
    // Limpar cache após cada teste para evitar interferência
    modelCacheService.invalidateAll();
  });

  // ==========================================================================
  // validateCapabilities - Validação de estrutura
  // ==========================================================================

  describe('validateCapabilities', () => {
    it('deve validar capabilities válidas com campos booleanos', () => {
      const result = capabilityValidationService.validateCapabilities({
        chat: true,
        streaming: true,
        vision: false,
        functionCalling: true
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve validar capabilities válidas com campos numéricos', () => {
      const result = capabilityValidationService.validateCapabilities({
        maxContextWindow: 200000,
        maxOutputTokens: 8192,
        maxImagesPerRequest: 10
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve validar capabilities válidas com campos de lista', () => {
      const result = capabilityValidationService.validateCapabilities({
        languages: ['en', 'pt', 'es'],
        supportedInputFormats: ['text', 'image'],
        supportedOutputFormats: ['text', 'json']
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve validar capabilities completas', () => {
      const result = capabilityValidationService.validateCapabilities({
        chat: true,
        streaming: true,
        vision: true,
        functionCalling: true,
        embeddings: false,
        codeGeneration: true,
        reasoning: true,
        multimodal: true,
        jsonMode: true,
        systemPrompt: true,
        maxContextWindow: 200000,
        maxOutputTokens: 8192,
        maxImagesPerRequest: 20,
        languages: ['en', 'pt'],
        supportedInputFormats: ['text', 'image'],
        supportedOutputFormats: ['text', 'json']
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar capabilities com tipo errado (boolean esperado)', () => {
      const result = capabilityValidationService.validateCapabilities({
        chat: 'true', // string em vez de boolean
        streaming: 1   // number em vez de boolean
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('chat'))).toBe(true);
    });

    it('deve rejeitar capabilities com tipo errado (number esperado)', () => {
      const result = capabilityValidationService.validateCapabilities({
        maxContextWindow: '200000', // string em vez de number
        maxOutputTokens: -100       // número negativo
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar capabilities com tipo errado (array esperado)', () => {
      const result = capabilityValidationService.validateCapabilities({
        languages: 'en,pt,es', // string em vez de array
        supportedInputFormats: { text: true } // object em vez de array
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve gerar warning para capabilities desconhecidas', () => {
      const result = capabilityValidationService.validateCapabilities({
        chat: true,
        unknownCapability: true,
        anotherUnknown: 'value'
      });

      expect(result.valid).toBe(true); // Warnings não invalidam
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('unknownCapability'))).toBe(true);
    });

    it('deve rejeitar null como capabilities', () => {
      const result = capabilityValidationService.validateCapabilities(null);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('objeto'))).toBe(true);
    });

    it('deve rejeitar string como capabilities', () => {
      const result = capabilityValidationService.validateCapabilities('invalid');

      expect(result.valid).toBe(false);
    });
  });

  // ==========================================================================
  // hasCapability - Verificação de capability individual
  // ==========================================================================

  describe('hasCapability', () => {
    let testModel: { id: string; name: string };

    beforeAll(async () => {
      testModel = await createTestModel(`Test Cap HasCap ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: false,
        functionCalling: true,
        maxContextWindow: 200000,
        maxOutputTokens: 8192,
        languages: ['en', 'pt']
      });
    });

    it('deve retornar true para capability booleana ativa', async () => {
      const result = await capabilityValidationService.hasCapability(testModel.id, 'chat');
      expect(result).toBe(true);
    });

    it('deve retornar false para capability booleana inativa', async () => {
      const result = await capabilityValidationService.hasCapability(testModel.id, 'vision');
      expect(result).toBe(false);
    });

    it('deve retornar true para capability numérica com valor > 0', async () => {
      const result = await capabilityValidationService.hasCapability(testModel.id, 'maxContextWindow');
      expect(result).toBe(true);
    });

    it('deve retornar true para capability de lista não vazia', async () => {
      const result = await capabilityValidationService.hasCapability(testModel.id, 'languages');
      expect(result).toBe(true);
    });

    it('deve retornar false para capability não definida', async () => {
      const result = await capabilityValidationService.hasCapability(testModel.id, 'embeddings');
      expect(result).toBe(false);
    });

    it('deve retornar false para modelo inexistente', async () => {
      const result = await capabilityValidationService.hasCapability(
        '00000000-0000-0000-0000-000000000000',
        'chat'
      );
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // hasAllCapabilities - Verificação de múltiplas capabilities
  // ==========================================================================

  describe('hasAllCapabilities', () => {
    let testModel: { id: string; name: string };

    beforeAll(async () => {
      testModel = await createTestModel(`Test Cap HasAll ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: true,
        functionCalling: true,
        maxContextWindow: 200000
      });
    });

    it('deve retornar true quando modelo tem todas as capabilities', async () => {
      const result = await capabilityValidationService.hasAllCapabilities(
        testModel.id,
        ['chat', 'streaming', 'vision']
      );
      expect(result).toBe(true);
    });

    it('deve retornar false quando modelo não tem uma das capabilities', async () => {
      const result = await capabilityValidationService.hasAllCapabilities(
        testModel.id,
        ['chat', 'streaming', 'embeddings'] // embeddings não existe
      );
      expect(result).toBe(false);
    });

    it('deve retornar true para lista vazia de capabilities', async () => {
      const result = await capabilityValidationService.hasAllCapabilities(testModel.id, []);
      expect(result).toBe(true);
    });

    it('deve incluir capabilities numéricas na verificação', async () => {
      const result = await capabilityValidationService.hasAllCapabilities(
        testModel.id,
        ['chat', 'maxContextWindow']
      );
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // hasAnyCapability - Verificação de pelo menos uma capability
  // ==========================================================================

  describe('hasAnyCapability', () => {
    let testModel: { id: string; name: string };

    beforeAll(async () => {
      testModel = await createTestModel(`Test Cap HasAny ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: false
      });
    });

    it('deve retornar true quando modelo tem pelo menos uma capability', async () => {
      const result = await capabilityValidationService.hasAnyCapability(
        testModel.id,
        ['vision', 'embeddings', 'chat'] // chat existe
      );
      expect(result).toBe(true);
    });

    it('deve retornar false quando modelo não tem nenhuma das capabilities', async () => {
      const result = await capabilityValidationService.hasAnyCapability(
        testModel.id,
        ['embeddings', 'codeGeneration', 'reasoning']
      );
      expect(result).toBe(false);
    });

    it('deve retornar false para lista vazia de capabilities', async () => {
      const result = await capabilityValidationService.hasAnyCapability(testModel.id, []);
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // getCapabilities - Obter capabilities de um modelo
  // ==========================================================================

  describe('getCapabilities', () => {
    let testModel: { id: string; name: string };
    const expectedCapabilities: ModelCapabilities = {
      chat: true,
      streaming: true,
      vision: true,
      maxContextWindow: 128000,
      maxOutputTokens: 4096,
      languages: ['en', 'pt', 'es']
    };

    beforeAll(async () => {
      testModel = await createTestModel(`Test Cap GetCaps ${Date.now()}`, expectedCapabilities);
    });

    it('deve retornar capabilities do modelo', async () => {
      const result = await capabilityValidationService.getCapabilities(testModel.id);

      expect(result).not.toBeNull();
      expect(result?.chat).toBe(true);
      expect(result?.streaming).toBe(true);
      expect(result?.vision).toBe(true);
      expect(result?.maxContextWindow).toBe(128000);
      expect(result?.maxOutputTokens).toBe(4096);
      expect(result?.languages).toEqual(['en', 'pt', 'es']);
    });

    it('deve retornar null para modelo inexistente', async () => {
      const result = await capabilityValidationService.getCapabilities(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // compareCapabilities - Comparação entre modelos
  // ==========================================================================

  describe('compareCapabilities', () => {
    let model1: { id: string; name: string };
    let model2: { id: string; name: string };

    beforeAll(async () => {
      model1 = await createTestModel(`Test Cap Compare1 ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: true,
        functionCalling: false,
        maxContextWindow: 200000,
        maxOutputTokens: 8192
      });

      model2 = await createTestModel(`Test Cap Compare2 ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: false,
        functionCalling: true,
        maxContextWindow: 128000,
        maxOutputTokens: 4096
      });
    });

    it('deve identificar capabilities em comum', async () => {
      const result = await capabilityValidationService.compareCapabilities(model1.id, model2.id);

      expect(result).not.toBeNull();
      expect(result?.common).toContain('chat');
      expect(result?.common).toContain('streaming');
    });

    it('deve identificar capabilities exclusivas do modelo 1', async () => {
      const result = await capabilityValidationService.compareCapabilities(model1.id, model2.id);

      expect(result).not.toBeNull();
      expect(result?.onlyInModel1).toContain('vision');
    });

    it('deve identificar capabilities exclusivas do modelo 2', async () => {
      const result = await capabilityValidationService.compareCapabilities(model1.id, model2.id);

      expect(result).not.toBeNull();
      expect(result?.onlyInModel2).toContain('functionCalling');
    });

    it('deve comparar valores numéricos', async () => {
      const result = await capabilityValidationService.compareCapabilities(model1.id, model2.id);

      expect(result).not.toBeNull();
      
      const contextComparison = result?.numericComparison.find(
        c => c.capability === 'maxContextWindow'
      );
      expect(contextComparison).toBeDefined();
      expect(contextComparison?.model1Value).toBe(200000);
      expect(contextComparison?.model2Value).toBe(128000);
      expect(contextComparison?.winner).toBe('model1');

      const outputComparison = result?.numericComparison.find(
        c => c.capability === 'maxOutputTokens'
      );
      expect(outputComparison).toBeDefined();
      expect(outputComparison?.winner).toBe('model1');
    });

    it('deve retornar null se um dos modelos não existir', async () => {
      const result = await capabilityValidationService.compareCapabilities(
        model1.id,
        '00000000-0000-0000-0000-000000000000'
      );
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // findModelsWithCapability - Busca por capability
  // ==========================================================================

  describe('findModelsWithCapability', () => {
    beforeAll(async () => {
      await createTestModel(`Test Cap Vision1 ${Date.now()}`, {
        chat: true,
        vision: true
      });
      await createTestModel(`Test Cap Vision2 ${Date.now()}`, {
        chat: true,
        vision: true,
        multimodal: true
      });
      await createTestModel(`Test Cap NoVision ${Date.now()}`, {
        chat: true,
        vision: false
      });
    });

    it('deve encontrar modelos com capability booleana', async () => {
      const models = await capabilityValidationService.findModelsWithCapability('vision');

      expect(models.length).toBeGreaterThanOrEqual(2);
      models.forEach(model => {
        const caps = model.capabilities as ModelCapabilities;
        expect(caps.vision).toBe(true);
      });
    });

    it('deve encontrar modelos com capability numérica', async () => {
      await createTestModel(`Test Cap Context ${Date.now()}`, {
        chat: true,
        maxContextWindow: 100000
      });

      const models = await capabilityValidationService.findModelsWithCapability('maxContextWindow');

      expect(models.length).toBeGreaterThanOrEqual(1);
      models.forEach(model => {
        const caps = model.capabilities as ModelCapabilities;
        expect(typeof caps.maxContextWindow).toBe('number');
        expect(caps.maxContextWindow).toBeGreaterThan(0);
      });
    });

    it('deve retornar array vazio para capability inexistente', async () => {
      const models = await capabilityValidationService.findModelsWithCapability('nonExistentCapability');
      expect(models).toEqual([]);
    });
  });

  // ==========================================================================
  // findModelsWithAllCapabilities - Busca por múltiplas capabilities
  // ==========================================================================

  describe('findModelsWithAllCapabilities', () => {
    beforeAll(async () => {
      await createTestModel(`Test Cap Multi1 ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: true,
        functionCalling: true
      });
      await createTestModel(`Test Cap Multi2 ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: false,
        functionCalling: true
      });
    });

    it('deve encontrar modelos com todas as capabilities', async () => {
      const models = await capabilityValidationService.findModelsWithAllCapabilities([
        'chat',
        'streaming',
        'functionCalling'
      ]);

      expect(models.length).toBeGreaterThanOrEqual(2);
      models.forEach(model => {
        const caps = model.capabilities as ModelCapabilities;
        expect(caps.chat).toBe(true);
        expect(caps.streaming).toBe(true);
        expect(caps.functionCalling).toBe(true);
      });
    });

    it('deve retornar menos modelos com mais requisitos', async () => {
      const modelsBasic = await capabilityValidationService.findModelsWithAllCapabilities([
        'chat',
        'streaming'
      ]);

      const modelsAdvanced = await capabilityValidationService.findModelsWithAllCapabilities([
        'chat',
        'streaming',
        'vision',
        'functionCalling'
      ]);

      expect(modelsBasic.length).toBeGreaterThanOrEqual(modelsAdvanced.length);
    });

    it('deve retornar todos os modelos ativos para lista vazia', async () => {
      const models = await capabilityValidationService.findModelsWithAllCapabilities([]);
      expect(models.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // findBestModelForTask - Recomendação de modelo
  // ==========================================================================

  describe('findBestModelForTask', () => {
    beforeAll(async () => {
      await createTestModel(`Test Cap Best1 ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: true,
        functionCalling: true,
        maxContextWindow: 200000,
        maxOutputTokens: 8192
      });
      await createTestModel(`Test Cap Best2 ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: false,
        functionCalling: false,
        maxContextWindow: 50000,
        maxOutputTokens: 2048
      });
    });

    it('deve encontrar melhor modelo para requisitos básicos', async () => {
      const result = await capabilityValidationService.findBestModelForTask(
        ['chat', 'streaming'],
        []
      );

      expect(result).not.toBeNull();
      expect(result?.score).toBeGreaterThanOrEqual(50);
      expect(result?.matchedCapabilities).toContain('chat');
      expect(result?.matchedCapabilities).toContain('streaming');
    });

    it('deve dar score maior para modelo com mais capabilities preferenciais', async () => {
      const result = await capabilityValidationService.findBestModelForTask(
        ['chat', 'streaming'],
        ['vision', 'functionCalling']
      );

      expect(result).not.toBeNull();
      expect(result?.score).toBeGreaterThan(50); // Bonus por capabilities preferenciais
    });

    it('deve retornar null se nenhum modelo atender requisitos', async () => {
      const result = await capabilityValidationService.findBestModelForTask(
        ['chat', 'streaming', 'embeddings', 'nonExistent'],
        []
      );

      expect(result).toBeNull();
    });

    it('deve incluir capabilities não atendidas em missingCapabilities', async () => {
      const result = await capabilityValidationService.findBestModelForTask(
        ['chat'],
        ['vision', 'embeddings', 'reasoning']
      );

      expect(result).not.toBeNull();
      expect(result?.missingCapabilities.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // validateContextWindow - Validação de tamanho de contexto
  // ==========================================================================

  describe('validateContextWindow', () => {
    let testModel: { id: string; name: string };

    beforeAll(async () => {
      testModel = await createTestModel(`Test Cap Context ${Date.now()}`, {
        chat: true,
        maxContextWindow: 100000
      });
    });

    it('deve retornar true para tokens dentro do limite', async () => {
      const result = await capabilityValidationService.validateContextWindow(testModel.id, 50000);
      expect(result).toBe(true);
    });

    it('deve retornar true para tokens no limite exato', async () => {
      const result = await capabilityValidationService.validateContextWindow(testModel.id, 100000);
      expect(result).toBe(true);
    });

    it('deve retornar false para tokens acima do limite', async () => {
      const result = await capabilityValidationService.validateContextWindow(testModel.id, 150000);
      expect(result).toBe(false);
    });

    it('deve retornar false para modelo inexistente', async () => {
      const result = await capabilityValidationService.validateContextWindow(
        '00000000-0000-0000-0000-000000000000',
        50000
      );
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // validateOutputTokens - Validação de tokens de saída
  // ==========================================================================

  describe('validateOutputTokens', () => {
    let testModel: { id: string; name: string };

    beforeAll(async () => {
      testModel = await createTestModel(`Test Cap Output ${Date.now()}`, {
        chat: true,
        maxOutputTokens: 4096
      });
    });

    it('deve retornar true para tokens dentro do limite', async () => {
      const result = await capabilityValidationService.validateOutputTokens(testModel.id, 2048);
      expect(result).toBe(true);
    });

    it('deve retornar false para tokens acima do limite', async () => {
      const result = await capabilityValidationService.validateOutputTokens(testModel.id, 8192);
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // updateCapabilities / mergeCapabilities - Atualização
  // ==========================================================================

  describe('updateCapabilities', () => {
    let testModel: { id: string; name: string };

    beforeEach(async () => {
      testModel = await createTestModel(`Test Cap Update ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: false
      });
    });

    it('deve substituir capabilities completamente', async () => {
      const newCaps: ModelCapabilities = {
        chat: false,
        embeddings: true,
        maxContextWindow: 50000
      };

      const result = await capabilityValidationService.updateCapabilities(testModel.id, newCaps);

      expect(result).not.toBeNull();
      const caps = result?.capabilities as ModelCapabilities;
      expect(caps.chat).toBe(false);
      expect(caps.embeddings).toBe(true);
      expect(caps.maxContextWindow).toBe(50000);
      expect(caps.streaming).toBeUndefined(); // Foi substituído
    });

    it('deve rejeitar capabilities inválidas', async () => {
      await expect(
        capabilityValidationService.updateCapabilities(testModel.id, {
          chat: 'invalid' as unknown as boolean
        })
      ).rejects.toThrow('Invalid capabilities');
    });

    it('deve retornar null para modelo inexistente', async () => {
      const result = await capabilityValidationService.updateCapabilities(
        '00000000-0000-0000-0000-000000000000',
        { chat: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('mergeCapabilities', () => {
    let testModel: { id: string; name: string };

    beforeEach(async () => {
      testModel = await createTestModel(`Test Cap Merge ${Date.now()}`, {
        chat: true,
        streaming: true,
        vision: false,
        maxContextWindow: 100000
      });
    });

    it('deve mesclar capabilities mantendo existentes', async () => {
      const result = await capabilityValidationService.mergeCapabilities(testModel.id, {
        vision: true,
        functionCalling: true
      });

      expect(result).not.toBeNull();
      const caps = result?.capabilities as ModelCapabilities;
      expect(caps.chat).toBe(true); // Mantido
      expect(caps.streaming).toBe(true); // Mantido
      expect(caps.vision).toBe(true); // Atualizado
      expect(caps.functionCalling).toBe(true); // Adicionado
      expect(caps.maxContextWindow).toBe(100000); // Mantido
    });

    it('deve sobrescrever valores existentes no merge', async () => {
      const result = await capabilityValidationService.mergeCapabilities(testModel.id, {
        maxContextWindow: 200000
      });

      expect(result).not.toBeNull();
      const caps = result?.capabilities as ModelCapabilities;
      expect(caps.maxContextWindow).toBe(200000);
    });
  });

  // ==========================================================================
  // Métodos auxiliares
  // ==========================================================================

  describe('Métodos auxiliares', () => {
    it('deve retornar lista de todas as capabilities', () => {
      const all = capabilityValidationService.getAllCapabilityNames();
      
      expect(all).toContain('chat');
      expect(all).toContain('streaming');
      expect(all).toContain('vision');
      expect(all).toContain('maxContextWindow');
      expect(all).toContain('languages');
      expect(all.length).toBeGreaterThan(10);
    });

    it('deve retornar lista de capabilities booleanas', () => {
      const booleans = capabilityValidationService.getBooleanCapabilityNames();
      
      expect(booleans).toContain('chat');
      expect(booleans).toContain('streaming');
      expect(booleans).toContain('vision');
      expect(booleans).not.toContain('maxContextWindow');
    });

    it('deve retornar lista de capabilities numéricas', () => {
      const numerics = capabilityValidationService.getNumericCapabilityNames();
      
      expect(numerics).toContain('maxContextWindow');
      expect(numerics).toContain('maxOutputTokens');
      expect(numerics).not.toContain('chat');
    });

    it('deve retornar lista de capabilities de lista', () => {
      const lists = capabilityValidationService.getListCapabilityNames();
      
      expect(lists).toContain('languages');
      expect(lists).toContain('supportedInputFormats');
      expect(lists).not.toContain('chat');
    });
  });
});
