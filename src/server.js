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
const clienteRoutes = require('./routes/cliente.routes');
const projetoRoutes = require('./routes/projeto.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const solicitacaoRoutes = require('./routes/solicitacao.routes');
const assistenteIARoutes = require('./routes/assistente-ia.routes');

const { swaggerUi, swaggerSpec } = require('./config/swagger');
const { iniciarCron } = require('./config/cron');
// Middleware de sincronização desativado para evitar alterações automáticas de dados
// const { middlewareSincronizacao } = require('./middleware/sincronizacao-dados');
const { fixTechRefreshDashboard } = require('./migrations/fix-tech-refresh-dashboard');
const { fixAgendadoFaltante } = require('./migrations/fix-agendado-faltante');
const { restoreH45C9H4 } = require('./migrations/restore-h45c9h4-final');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://tech-refresh.cloud',
  'https://www.tech-refresh.cloud',
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-empresa-id', 'x-projeto-id'],
}));

// Confia no proxy reverso (Nginx na VPS)
app.set('trust proxy', 1);

// Responde preflight OPTIONS em todas as rotas
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware de sincronização desativado
// app.use(middlewareSincronizacao);

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
app.use('/api/clientes', clienteRoutes);
app.use('/api/projetos', projetoRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/solicitacoes', solicitacaoRoutes);
app.use('/api/assistente-ia', assistenteIARoutes);

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
  iniciarCron();
  // Executar migrações de correção do dashboard
  fixTechRefreshDashboard().catch(err => console.error('[MIGRATION ERROR]', err));
  fixAgendadoFaltante().catch(err => console.error('[MIGRATION ERROR]', err));
  restoreH45C9H4().catch(err => console.error('[MIGRATION ERROR]', err));
});

module.exports = app;
