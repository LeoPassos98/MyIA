// backend/src/server.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { httpLoggerMiddleware } from './middleware/httpLogger';
import { prisma } from './lib/prisma';
import { authLimiter, apiLimiter, chatLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import aiRoutes from './routes/aiRoutes';
import userSettingsRoutes from './routes/userSettingsRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import userRoutes from './routes/userRoutes';
import chatHistoryRoutes from './routes/chatHistoryRoutes';
import auditRoutes from './routes/auditRoutes';
import promptTraceRoutes from './routes/promptTraceRoutes';
import providersRoutes from './routes/providers';
import certificationRoutes from './routes/certificationRoutes';
import modelsRoutes from './routes/modelsRoutes';
import logsRoutes from './routes/logsRoutes';
import certificationQueueRoutes from './routes/certificationQueueRoutes';
import passport from './config/passport';


const app = express();


// 🔒 Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Permite embeddings (caso necessário)
}));

// 🔒 HTTPS Redirect (Production only)
if (config.nodeEnv === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      logger.warn(`HTTP request redirected to HTTPS: ${req.url}`);
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Middlewares globais
// Usar lista de origens definida em config (parsing centralizado em config/env.ts)
const allowedOrigins = config.corsOrigins || [String(config.corsOrigin)];

app.use(cors({
  origin: (incomingOrigin, callback) => {
    // Se não houver Origin (p.ex. chamadas por curl/postman), permitir
    if (!incomingOrigin) return callback(null, true);
    // Permitir se a origem estiver na lista
    if (allowedOrigins.includes(incomingOrigin)) return callback(null, true);
    // Caso contrário, logar e bloquear — útil para debugging em dev
    logger.warn(`Blocked CORS origin: ${incomingOrigin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Garantir resposta para preflight requests
app.options('*', cors());
app.use(express.json());

// 🔍 Request ID Middleware - Gera UUID único para cada requisição
app.use(requestIdMiddleware);

// 📊 HTTP Logger Middleware - Log estruturado de requisições HTTP
// Fase 1 HTTP Logging: docs/LOGGING-ENHANCEMENT-PROPOSAL.md
app.use(httpLoggerMiddleware);

// Inicializa Passport para OAuth (ANTES das rotas)
app.use(passport.initialize());

// Health check endpoint (adicione antes das outras rotas)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
// 🔒 Rate Limiting para autenticação (proteção contra brute force)
app.use('/api/auth', authLimiter, authRoutes);
// 🔒 Rate Limiting para chat (proteção contra spam)
app.use('/api/chat', chatLimiter, chatRoutes);
// 🔒 Rate Limiting geral para APIs
app.use('/api/ai', apiLimiter, aiRoutes);
app.use('/api/settings', apiLimiter, userSettingsRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/user', apiLimiter, userRoutes);
app.use('/api/chat-history', apiLimiter, chatHistoryRoutes);
app.use('/api/audit', apiLimiter, auditRoutes);
app.use('/api/prompt-trace', apiLimiter, promptTraceRoutes);
app.use('/api/providers', apiLimiter, providersRoutes);
app.use('/api/certification', certificationRoutes);
app.use('/api/certification-queue', apiLimiter, certificationQueueRoutes);
app.use('/api/models', apiLimiter, modelsRoutes);
app.use('/api/logs', apiLimiter, logsRoutes);

// Rota 404
app.use((req, res) => {
  logger.info(`❌ [404] Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    logger.info('🔧 Inicializando servidor...');
    logger.info('📦 Carregando dependências...');
    
    // Teste de conexão com banco
    logger.info('🗄️  Conectando ao banco de dados...');
    await prisma.$connect();
    logger.info('✅ Banco de dados conectado!');
    
    app.listen(PORT, () => {
      logger.info('✅ Servidor rodando!');
      logger.info(`🚀 Backend disponível em http://localhost:${PORT}`);
      logger.info(`💚 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🌍 CORS configurado para: ${allowedOrigins.join(', ')}`);
      logger.info(`📝 Ambiente: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    logger.error('💡 Verifique se o PostgreSQL está rodando e o .env está configurado');
    process.exit(1);
  }
}

// Graceful shutdown - desconecta do banco ao encerrar
process.on('SIGINT', async () => {
  logger.info('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  logger.info('✅ Banco desconectado');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  logger.info('✅ Banco desconectado');
  process.exit(0);
});

// Capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    promise: String(promise),
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
  // Em produção, você pode querer encerrar o processo
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  // Em produção, encerre o processo
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
});

startServer();