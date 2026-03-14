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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
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

if (process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
