const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { listar, criar, atualizar } = require('../controllers/projeto.controller');

router.use(authMiddleware);
router.get('/', listar);
router.post('/', adminMiddleware, criar);
router.put('/:id', adminMiddleware, atualizar);

module.exports = router;
