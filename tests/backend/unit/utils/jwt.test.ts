import { generateToken, verifyToken } from '../../../src/utils/jwt';

describe('Utilitários JWT', () => {
  const mockPayload = {
    userId: 'test-user-id-123',
    email: 'test@example.com',
  };

  describe('generateToken', () => {
    it('deve gerar um token JWT válido', () => {
      // Arrange
      // mockPayload já definido acima

      // Act
      const token = generateToken(mockPayload);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT tem 3 partes: header.payload.signature
    });

    it('deve gerar token com estrutura correta', () => {
      // Arrange
      const payload = { userId: '123', email: 'user@test.com' };

      // Act
      const token = generateToken(payload);

      // Assert
      const parts = token.split('.');
      expect(parts[0]).toBeTruthy(); // header
      expect(parts[1]).toBeTruthy(); // payload
      expect(parts[2]).toBeTruthy(); // signature
    });
  });

  describe('verifyToken', () => {
    it('deve verificar token válido e retornar payload', () => {
      // Arrange
      const token = generateToken(mockPayload);

      // Act
      const decoded = verifyToken(token);

      // Assert
      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty('userId', mockPayload.userId);
      expect(decoded).toHaveProperty('email', mockPayload.email);
      expect(decoded).toHaveProperty('iat'); // issued at timestamp
      expect(decoded).toHaveProperty('exp'); // expiration timestamp
    });

    it('deve lançar erro para token inválido', () => {
      // Arrange
      const invalidToken = 'invalid.token.here';

      // Act & Assert
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('deve lançar erro para token malformado', () => {
      // Arrange
      const malformedToken = 'not-a-valid-jwt-format';

      // Act & Assert
      expect(() => verifyToken(malformedToken)).toThrow('jwt malformed');
    });

    it('deve lançar erro para token vazio', () => {
      // Arrange
      const emptyToken = '';

      // Act & Assert
      expect(() => verifyToken(emptyToken)).toThrow();
    });
  });

  describe('Integração de Token', () => {
    it('deve gerar e verificar token com mesmo payload', () => {
      // Arrange
      const payload = {
        userId: 'user-456',
        email: 'another@test.com',
      };

      // Act
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      // Assert
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });
  });
});