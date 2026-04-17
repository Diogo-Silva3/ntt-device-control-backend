const router = require('express').Router();
const ctrl = require('../controllers/solicitacao.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/board', ctrl.board);
router.get('/dashboard', ctrl.dashboard);
router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.get('/:id/auditoria', ctrl.listarAuditoria);
router.get('/:id', ctrl.buscarPorId);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.excluir);

module.exports = router;
