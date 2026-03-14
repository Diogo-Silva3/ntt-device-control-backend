const router = require('express').Router();
const ctrl = require('../controllers/vinculacao.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.put('/:id/encerrar', ctrl.encerrar);

module.exports = router;
