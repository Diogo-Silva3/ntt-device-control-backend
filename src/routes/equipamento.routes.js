const router = require('express').Router();
const ctrl = require('../controllers/equipamento.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/fotos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `eq-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true)
  else cb(new Error('Apenas imagens são permitidas'))
}});

router.use(authMiddleware);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.get('/:id/qrcode', ctrl.qrcode);
router.post('/', ctrl.criar);
router.post('/regenerar-qrcodes', adminMiddleware, ctrl.regenerarQrCodes);
router.post('/:id/foto', upload.single('foto'), ctrl.uploadFoto);
router.put('/:id', ctrl.atualizar);
router.put('/:id/checklist', ctrl.atualizarChecklist);
router.put('/:id/agendamento', ctrl.atualizarAgendamento);
router.delete('/:id', adminMiddleware, ctrl.deletar);

module.exports = router;
