const router = require('express').Router();
const multer = require('multer');
const ctrl = require('../controllers/importacao.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

router.post('/preview', upload.single('arquivo'), ctrl.previewPlanilha);
router.post('/usuarios', adminMiddleware, upload.single('arquivo'), ctrl.importarUsuarios);
router.post('/equipamentos', adminMiddleware, upload.single('arquivo'), ctrl.importarEquipamentos);
router.post('/solicitacoes', adminMiddleware, upload.single('arquivo'), ctrl.importarSolicitacoes);

module.exports = router;
