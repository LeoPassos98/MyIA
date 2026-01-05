// backend/src/server.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './lib/prisma';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import aiRoutes from './routes/aiRoutes';
import userSettingsRoutes from './routes/userSettingsRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import userRoutes from './routes/userRoutes';
import chatHistoryRoutes from './routes/chatHistoryRoutes';
import auditRoutes from './routes/auditRoutes';
import promptTraceRoutes from './routes/promptTraceRoutes';



const app = express();

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

// Log de requisições
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint (adicione antes das outras rotas)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', userSettingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/prompt-trace', promptTraceRoutes);


// Rota 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    console.log('🔧 Inicializando servidor...');
    console.log('📦 Carregando dependências...');

    // Teste de conexão com banco
    console.log('🗄️  Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Banco de dados conectado!');

    app.listen(PORT, () => {
      console.log('✅ Servidor rodando!');
      console.log(`🚀 Backend disponível em http://localhost:${PORT}`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 CORS configurado para: ${allowedOrigins.join(', ')}`);
      console.log(`📝 Ambiente: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    console.error('💡 Verifique se o PostgreSQL está rodando e o .env está configurado');
    process.exit(1);
  }
}

// Graceful shutdown - desconecta do banco ao encerrar
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Banco desconectado');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Banco desconectado');
  process.exit(0);
});

// Capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Em produção, você pode querer encerrar o processo
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Em produção, encerre o processo
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
});

startServer();