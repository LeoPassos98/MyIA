import { contextService } from '../../../src/services/contextService';

describe('ContextService', () => {
  const userId1 = 'user-123';
  const userId2 = 'user-456';

  // Limpar timers ao final
  afterAll(() => {
    contextService.stopCleanupTask(); 
    jest.clearAllTimers();
  });

  beforeEach(() => {
    // Limpar contextos antes de cada teste
    contextService.clearContext(userId1);
    contextService.clearContext(userId2);
  });

  describe('addMessage', () => {
    it('deve adicionar mensagem do usuário ao contexto', () => {
      // Arrange
      const message = 'Olá, como você está?';

      // Act
      contextService.addMessage(userId1, 'user', message);

      // Assert
      const messages = contextService.getMessages(userId1);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toHaveProperty('role', 'user');
      expect(messages[0]).toHaveProperty('content', message);
      expect(messages[0]).toHaveProperty('timestamp');
      expect(messages[0].timestamp).toBeInstanceOf(Date);
    });

    it('deve adicionar mensagem do assistente ao contexto', () => {
      // Arrange
      const userMessage = 'Olá!';
      const assistantMessage = 'Olá! Como posso ajudar?';

      // Act
      contextService.addMessage(userId1, 'user', userMessage);
      contextService.addMessage(userId1, 'assistant', assistantMessage);

      // Assert
      const messages = contextService.getMessages(userId1);
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe(assistantMessage);
    });

    it('deve manter ordem cronológica das mensagens', () => {
      // Arrange & Act
      contextService.addMessage(userId1, 'user', 'Primeira mensagem');
      contextService.addMessage(userId1, 'assistant', 'Segunda mensagem');
      contextService.addMessage(userId1, 'user', 'Terceira mensagem');

      // Assert
      const messages = contextService.getMessages(userId1);
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('Primeira mensagem');
      expect(messages[1].content).toBe('Segunda mensagem');
      expect(messages[2].content).toBe('Terceira mensagem');
    });

    it('deve limitar contexto ao máximo de mensagens configurado', () => {
      // Arrange
      const maxMessages = 15;

      // Act - Adicionar 20 mensagens
      for (let i = 1; i <= 20; i++) {
        contextService.addMessage(userId1, 'user', `Mensagem ${i}`);
      }

      // Assert
      const messages = contextService.getMessages(userId1);
      expect(messages).toHaveLength(maxMessages);
      
      // Deve manter apenas as últimas 15
      expect(messages[0].content).toBe('Mensagem 6');
      expect(messages[14].content).toBe('Mensagem 20');
    });

    it('deve remover mensagens antigas quando exceder o limite', () => {
      // Arrange
      contextService.addMessage(userId1, 'user', 'Mensagem antiga 1');
      contextService.addMessage(userId1, 'user', 'Mensagem antiga 2');

      // Act - Adicionar 14 novas mensagens
      for (let i = 3; i <= 16; i++) {
        contextService.addMessage(userId1, 'user', `Mensagem ${i}`);
      }

      // Assert
      const messages = contextService.getMessages(userId1);
      expect(messages).toHaveLength(15);
      expect(messages[0].content).not.toBe('Mensagem antiga 1');
      expect(messages[0].content).toBe('Mensagem antiga 2');
    });
  });

  describe('getMessages', () => {
    it('deve retornar array vazio para usuário sem contexto', () => {
      // Act
      const messages = contextService.getMessages('usuario-inexistente');

      // Assert
      expect(messages).toEqual([]);
      expect(messages).toHaveLength(0);
    });

    it('deve retornar apenas mensagens do usuário específico', () => {
      // Arrange
      contextService.addMessage(userId1, 'user', 'Mensagem do usuário 1');
      contextService.addMessage(userId2, 'user', 'Mensagem do usuário 2');

      // Act
      const messages1 = contextService.getMessages(userId1);
      const messages2 = contextService.getMessages(userId2);

      // Assert
      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
      expect(messages1[0].content).toBe('Mensagem do usuário 1');
      expect(messages2[0].content).toBe('Mensagem do usuário 2');
    });
  });

  describe('clearContext', () => {
    it('deve limpar todas as mensagens do usuário', () => {
      // Arrange
      contextService.addMessage(userId1, 'user', 'Mensagem 1');
      contextService.addMessage(userId1, 'user', 'Mensagem 2');
      contextService.addMessage(userId1, 'user', 'Mensagem 3');

      // Act
      contextService.clearContext(userId1);

      // Assert
      const messages = contextService.getMessages(userId1);
      expect(messages).toEqual([]);
      expect(messages).toHaveLength(0);
    });

    it('não deve afetar contexto de outros usuários', () => {
      // Arrange
      contextService.addMessage(userId1, 'user', 'Mensagem usuário 1');
      contextService.addMessage(userId2, 'user', 'Mensagem usuário 2');

      // Act
      contextService.clearContext(userId1);

      // Assert
      const messages1 = contextService.getMessages(userId1);
      const messages2 = contextService.getMessages(userId2);

      expect(messages1).toHaveLength(0);
      expect(messages2).toHaveLength(1);
      expect(messages2[0].content).toBe('Mensagem usuário 2');
    });

    it('deve permitir adicionar novas mensagens após limpar', () => {
      // Arrange
      contextService.addMessage(userId1, 'user', 'Mensagem antiga');
      contextService.clearContext(userId1);

      // Act
      contextService.addMessage(userId1, 'user', 'Mensagem nova');

      // Assert
      const messages = contextService.getMessages(userId1);
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Mensagem nova');
    });
  });

  describe('getContextSize', () => {
    it('deve retornar 0 para usuário sem contexto', () => {
      // Act
      const size = contextService.getContextSize('usuario-inexistente');

      // Assert
      expect(size).toBe(0);
    });

    it('deve retornar número correto de mensagens', () => {
      // Arrange
      contextService.addMessage(userId1, 'user', 'Mensagem 1');
      contextService.addMessage(userId1, 'assistant', 'Resposta 1');
      contextService.addMessage(userId1, 'user', 'Mensagem 2');

      // Act
      const size = contextService.getContextSize(userId1);

      // Assert
      expect(size).toBe(3);
    });

    it('deve atualizar tamanho após adicionar mensagens', () => {
      // Arrange
      expect(contextService.getContextSize(userId1)).toBe(0);

      // Act
      contextService.addMessage(userId1, 'user', 'Nova mensagem');

      // Assert
      expect(contextService.getContextSize(userId1)).toBe(1);
    });

    it('deve atualizar tamanho após limpar contexto', () => {
      // Arrange
      contextService.addMessage(userId1, 'user', 'Mensagem');
      expect(contextService.getContextSize(userId1)).toBe(1);

      // Act
      contextService.clearContext(userId1);

      // Assert
      expect(contextService.getContextSize(userId1)).toBe(0);
    });
  });

  describe('Isolamento de Contextos', () => {
    it('deve manter contextos de múltiplos usuários isolados', () => {
      // Arrange & Act
      contextService.addMessage(userId1, 'user', 'Mensagem user 1');
      contextService.addMessage(userId1, 'assistant', 'Resposta user 1');
      
      contextService.addMessage(userId2, 'user', 'Mensagem user 2');
      contextService.addMessage(userId2, 'assistant', 'Resposta user 2');

      // Assert
      const messages1 = contextService.getMessages(userId1);
      const messages2 = contextService.getMessages(userId2);

      expect(messages1).toHaveLength(2);
      expect(messages2).toHaveLength(2);
      
      expect(messages1[0].content).toBe('Mensagem user 1');
      expect(messages2[0].content).toBe('Mensagem user 2');
    });

    it('deve permitir operações independentes em cada contexto', () => {
      // Arrange
      contextService.addMessage(userId1, 'user', 'User 1');
      contextService.addMessage(userId2, 'user', 'User 2');

      // Act
      contextService.clearContext(userId1);
      contextService.addMessage(userId1, 'user', 'User 1 novo');

      // Assert
      expect(contextService.getContextSize(userId1)).toBe(1);
      expect(contextService.getContextSize(userId2)).toBe(1);
      expect(contextService.getMessages(userId1)[0].content).toBe('User 1 novo');
      expect(contextService.getMessages(userId2)[0].content).toBe('User 2');
    });
  });

  describe('Integração', () => {
    it('deve gerenciar fluxo completo de conversa', () => {
      contextService.addMessage(userId1, 'user', 'Qual é a capital do Brasil?');
      expect(contextService.getContextSize(userId1)).toBe(1);

      contextService.addMessage(userId1, 'assistant', 'A capital do Brasil é Brasília.');
      expect(contextService.getContextSize(userId1)).toBe(2);

      contextService.addMessage(userId1, 'user', 'E quantos habitantes tem?');
      expect(contextService.getContextSize(userId1)).toBe(3);

      contextService.addMessage(userId1, 'assistant', 'Brasília tem aproximadamente 3 milhões de habitantes.');
      expect(contextService.getContextSize(userId1)).toBe(4);

      const messages = contextService.getMessages(userId1);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[2].role).toBe('user');
      expect(messages[3].role).toBe('assistant');
    });
  });
});