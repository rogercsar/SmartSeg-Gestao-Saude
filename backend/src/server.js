import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection, isDbConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import entityRoutes from './routes/entityRoutes.js';
import functionRoutes from './routes/functionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rotas da Aplicação
app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/functions', functionRoutes);

// Rota de configurações públicas exigida pelo frontend
app.get('/api/app/public-settings', (req, res) => {
  res.json({
    id: 'smartseg',
    name: 'SmartSeg — SST & Saúde Ocupacional',
    public_settings: {
      allow_registration: true,
      auth_methods: ['email'],
    },
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? 'connected' : 'disconnected',
  });
});

// Middleware de rota não encontrada
app.use((req, res) => {
  res.status(404).json({ message: `Rota ${req.method} ${req.url} não encontrada` });
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('[Erro de Servidor]:', err);
  res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
});

// Inicialização
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 SmartSeg Backend rodando em: http://localhost:${PORT}`);
  console.log(`📡 Endpoint da API: http://localhost:${PORT}/api`);
  console.log(`===============================================`);
  await testConnection();
});
