require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const equipamentoRoutes = require('./routes/equipamento.routes');
const unidadeRoutes = require('./routes/unidade.routes');
const vinculacaoRoutes = require('./routes/vinculacao.routes');
const relatorioRoutes = require('./routes/relatorio.routes');
const importacaoRoutes = require('./routes/importacao.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const chamadoRoutes = require('./routes/chamado.routes');

const { swaggerUi, swaggerSpec } = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'https://nttdevicecontrol.web.app',
  'https://nttdevicecontrol.firebaseapp.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: mobile, Postman) e origens permitidas
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Responde preflight OPTIONS em todas as rotas
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/equipamentos', equipamentoRoutes);
app.use('/api/unidades', unidadeRoutes);
app.use('/api/vinculacoes', vinculacaoRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/importacao', importacaoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chamados', chamadoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);

  // Auto-ping a cada 5 minutos para evitar sleep no Railway
  const SELF_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/health`
    : `http://localhost:${PORT}/api/health`;

  setInterval(async () => {
    try {
      const https = require('https');
      const http = require('http');
      const client = SELF_URL.startsWith('https') ? https : http;
      client.get(SELF_URL, () => {}).on('error', () => {});
    } catch (_) {}
  }, 5 * 60 * 1000); // 5 minutos
});

module.exports = app;
