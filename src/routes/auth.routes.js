const router = require('express').Router();
const { login, register, me } = require('../controllers/auth.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login do usuário
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               senha: { type: string }
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar novo usuário (admin)
 *     tags: [Auth]
 */
router.post('/register', authMiddleware, adminMiddleware, register);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Dados do usuário logado
 *     tags: [Auth]
 */
router.get('/me', authMiddleware, me);

module.exports = router;
