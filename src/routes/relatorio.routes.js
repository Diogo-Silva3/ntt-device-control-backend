const router = require('express').Router();
const ctrl = require('../controllers/relatorio.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/por-unidade', ctrl.getEquipamentosPorUnidade);
router.get('/disponiveis', ctrl.getEquipamentosDisponiveis);
router.get('/preparacao', ctrl.getRelatorioPreparacao);
router.get('/agendamentos-semana', ctrl.getAgendamentosSemana);
router.get('/colaboradores', ctrl.getTodosColaboradores);
router.get('/vinculacoes-ativas', ctrl.getVinculacoesAtivas);
router.get('/equipamentos-por-unidade', ctrl.getEquipamentosPorUnidadeResumo);
router.get('/colaboradores-sem-equipamento', ctrl.getColaboradoresSemEquipamento);
router.get('/equipamentos-sem-colaborador', ctrl.getEquipamentosSemColaborador);
router.get('/exportar/pdf', ctrl.exportarPDF);
router.get('/exportar/excel', ctrl.exportarExcel);
router.get('/improdutivos', ctrl.getImprodutivos);
router.get('/exportar/improdutivos', ctrl.exportarImprodutivos);

module.exports = router;
