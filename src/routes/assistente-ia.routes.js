const express = require('express');
const { chat } = require('../controllers/assistente-ia.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * POST /api/assistente-ia/chat
 * Enviar mensagem para o assistente IA
 * Body: { mensagem: string }
 * Response: { tipo, resposta, timestamp }
 */
router.post('/chat', authMiddleware, chat);

module.exports = router;
