const router = require('express').Router();
const ctrl = require('../controllers/vinculacao.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.put('/:id/encerrar', ctrl.encerrar);
router.put('/:id/reagendar', ctrl.reagendar);
router.put('/:id/nao-compareceu', ctrl.marcarNaoCompareceu);
router.put('/:id/entregue', ctrl.marcarEntregue);
router.put('/:id/tecnico', ctrl.atualizarTecnico);
router.post('/:id/transferir', ctrl.transferir);

module.exports = router;
