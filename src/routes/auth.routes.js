const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { login, register, me, esqueciSenha, redefinirSenha } = require('../controllers/auth.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.post('/register', authMiddleware, adminMiddleware, register);
router.post('/esqueci-senha', esqueciSenha);
router.post('/redefinir-senha', redefinirSenha);
router.get('/me', authMiddleware, me);

router.get('/dominios', authMiddleware, adminMiddleware, (req, res) => {
  const dominios = process.env.ALLOWED_DOMAINS
    ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
    : ['@grupobimbo.com', '@global.nttdata.com', '@gbsupport.net', '@nttdata.com'];
  res.json({ dominios });
});

module.exports = router;
