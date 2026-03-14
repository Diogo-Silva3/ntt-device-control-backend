const router = require('express').Router();
const ctrl = require('../controllers/unidade.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', adminMiddleware, ctrl.criar);
router.put('/:id', adminMiddleware, ctrl.atualizar);
router.delete('/:id', adminMiddleware, ctrl.deletar);

module.exports = router;
