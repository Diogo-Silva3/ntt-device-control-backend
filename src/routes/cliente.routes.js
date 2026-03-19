const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { superAdminMiddleware } = require('../middleware/auth.middleware');
const { listar, criar, atualizar } = require('../controllers/cliente.controller');

router.use(authMiddleware, superAdminMiddleware);
router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);

module.exports = router;
