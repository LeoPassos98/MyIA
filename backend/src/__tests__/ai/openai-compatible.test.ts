import { aiService } from '../../services/aiService';

describe('OpenAI-Compatible Providers', () => {
  
  describe('getConfiguredProviders', () => {
    it('should list all available providers', () => {
      const providers = aiService.getConfiguredProviders();
      
      expect(providers).toBeInstanceOf(Array);
      expect(providers.length).toBeGreaterThan(0);
      
      // Verificar estrutura
      providers.forEach(provider => {
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('configured');
        expect(provider).toHaveProperty('model');
      });
    });

    it('should detect configured providers', () => {
      const providers = openaiService.getConfiguredProviders();
      const configured = providers.filter(p => p.configured);
      
      // Pelo menos 1 deve estar configurado para os testes rodarem
      console.log('Configured providers:', configured.map(p => p.name).join(', ') || 'none');
    });
  });

  describe('testProvider - Health Check', () => {
    const providers = ['openai', 'groq', 'together', 'perplexity', 'mistral'] as const;

    // Testar cada provider individualmente
    providers.forEach(provider => {
      it(`should test ${provider} connection`, async () => {
        const result = await openaiService.testProvider(provider);
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        
        if (result.success) {
          expect(result).toHaveProperty('responseTime');
          expect(result.responseTime).toBeGreaterThan(0);
          console.log(`✅ ${provider}: ${result.message} (${result.responseTime}ms)`);
        } else {
          console.log(`⚠️  ${provider}: ${result.message}`);
        }
      }, 10000); // Timeout de 10s por provider
    });
  });

  describe('chat - Message Generation', () => {
    it('should return mock response if no provider configured', async () => {
      // Usar provider que sabemos que não está configurado
      const response = await openaiService.chat(
        [{ role: 'user', content: 'Test' }],
        'mistral' // Provavelmente não configurado
      );
      
      expect(response).toContain('mock');
    });

    it('should generate response with configured provider', async () => {
      // Encontrar um provider configurado
      const providers = openaiService.getConfiguredProviders();
      const configured = providers.find(p => p.configured);
      
      if (!configured) {
        console.log('⚠️  No providers configured, skipping real API test');
        return;
      }

      const response = await openaiService.chat(
        [{ role: 'user', content: 'Hi' }],
        configured.name as any
      );
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      
      console.log(`✅ ${configured.name} generated response:`, response.substring(0, 100));
    }, 15000); // 15s timeout para geração real
  });

  describe('Error Handling', () => {
    it('should handle invalid provider gracefully', async () => {
      await expect(
        openaiService.testProvider('invalid' as any)
      ).rejects.toThrow('Unknown provider');
    });

    it('should return helpful message for unconfigured provider', async () => {
      const response = await openaiService.chat(
        [{ role: 'user', content: 'Test' }],
        'perplexity' // Assumindo que não está configurado
      );
      
      // Deve retornar mensagem útil, não um erro
      expect(response).toContain('mock');
      expect(response).toContain('PERPLEXITY_API_KEY');
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const providers = openaiService.getConfiguredProviders();
      const configured = providers.find(p => p.configured);
      
      if (!configured) {
        console.log('⚠️  No providers configured, skipping performance test');
        return;
      }

      const startTime = Date.now();
      
      await openaiService.chat(
        [{ role: 'user', content: 'Hi' }],
        configured.name as any
      );
      
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  ${configured.name} response time: ${duration}ms`);
      
      // Deve responder em menos de 10 segundos
      expect(duration).toBeLessThan(10000);
    }, 15000);
  });
});