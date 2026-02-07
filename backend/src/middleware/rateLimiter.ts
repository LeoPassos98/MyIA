// backend/src/middleware/rateLimiter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { jsend } from '../utils/jsend';

/**
 * Rate limiter para endpoints de autenticação (login/register)
 * Protege contra ataques de força bruta
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Aumentado para desenvolvimento
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for auth from IP: ${req.ip}`);
    res.status(429).json(jsend.error(
      'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
      429,
      { retryAfter: '15 minutes' }
    ));
  },
});

/**
 * Rate limiter geral para APIs
 * Protege contra abuso e DDoS
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 500, // Aumentado para desenvolvimento (500 requisições/min)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for API from IP: ${req.ip}`);
    res.status(429).json(jsend.error(
      'Limite de requisições excedido. Tente novamente em breve.',
      429
    ));
  },
});

/**
 * Rate limiter para endpoints de chat/IA
 * Mais permissivo que API geral, mas previne abuso
 */
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // Aumentado para desenvolvimento (100 mensagens/min)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Chat rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json(jsend.error(
      'Você está enviando mensagens muito rápido. Aguarde um momento.',
      429
    ));
  },
});
