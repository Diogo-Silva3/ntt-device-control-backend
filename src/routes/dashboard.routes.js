const router = require('express').Router();
const { getDashboard, dashboardTecnicos } = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/', authMiddleware, getDashboard);
router.get('/tecnicos', authMiddleware, dashboardTecnicos);

module.exports = router;
