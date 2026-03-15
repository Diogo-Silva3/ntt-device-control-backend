const router = require('express').Router();
const ctrl = require('../controllers/equipamento.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.get('/:id/qrcode', ctrl.qrcode);
router.post('/', ctrl.criar);
router.post('/regenerar-qrcodes', adminMiddleware, ctrl.regenerarQrCodes);
router.put('/:id', ctrl.atualizar);
router.put('/:id/checklist', ctrl.atualizarChecklist);
router.put('/:id/agendamento', ctrl.atualizarAgendamento);
router.delete('/:id', adminMiddleware, ctrl.deletar);

module.exports = router;
