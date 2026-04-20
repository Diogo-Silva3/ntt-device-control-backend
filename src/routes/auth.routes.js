const router = require('express').Router();
const { login, register, me, esqueciSenha, redefinirSenha } = require('../controllers/auth.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

router.post('/login', login);
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
