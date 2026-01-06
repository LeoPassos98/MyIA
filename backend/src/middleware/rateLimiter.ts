// backend/src/middleware/rateLimiter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * Rate limiter para endpoints de autenticação (login/register)
 * Protege contra ataques de força bruta
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo de 5 tentativas por IP
  message: {
    error: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for auth from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
      retryAfter: '15 minutes'
    });
  },
});

/**
 * Rate limiter geral para APIs
 * Protege contra abuso e DDoS
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // Máximo de 100 requisições por minuto por IP
  message: {
    error: 'Limite de requisições excedido. Tente novamente em breve.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for API from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Limite de requisições excedido. Tente novamente em breve.',
    });
  },
});

/**
 * Rate limiter para endpoints de chat/IA
 * Mais permissivo que API geral, mas previne abuso
 */
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // Máximo de 30 mensagens por minuto
  message: {
    error: 'Você está enviando mensagens muito rápido. Aguarde um momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Chat rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Você está enviando mensagens muito rápido. Aguarde um momento.',
    });
  },
});
