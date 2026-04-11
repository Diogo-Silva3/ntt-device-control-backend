const router = require('express').Router();
const { listar } = require('../controllers/auditoria.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', listar);

module.exports = router;
