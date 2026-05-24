const router = require('express').Router();
const ctrl = require('../controllers/importacao.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/importacoes');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `import-${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // limite de 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Apenas planilhas Excel (.xlsx, .xls) ou arquivos CSV são permitidos'));
    }
  }
});

// Todas as rotas de importação requerem login e cargo de Administrador/SuperAdmin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/template', ctrl.baixarTemplate);
router.post('/validar', upload.single('arquivo'), ctrl.validarArquivo);
router.post('/importar', upload.single('arquivo'), ctrl.importarSolicitacoes);
router.post('/preview', upload.single('arquivo'), ctrl.preview);
router.post('/usuarios', upload.single('arquivo'), ctrl.importarColaboradores);
router.post('/equipamentos', upload.single('arquivo'), ctrl.importarEquipamentos);
router.post('/solicitacoes', upload.single('arquivo'), ctrl.importarSolicitacoes);

module.exports = router;
