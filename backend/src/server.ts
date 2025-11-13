import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import aiRoutes from './routes/aiRoutes';
import userSettingsRoutes from './routes/userSettingsRoutes';

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', userSettingsRoutes);

// Rota 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(`🌐 CORS enabled for: ${config.corsOrigins?.join(', ') || config.corsOrigin}`);
});