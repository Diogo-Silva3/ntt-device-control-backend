const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const importacaoController = require('../controllers/importacao.controller');
const { autenticar } = require('../middleware/auth.middleware');

// Configurar multer para upload temporário
const upload = multer({
  dest: path.join(__dirname, '../../uploads/temp'),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos'));
    }
  }
});

// Importar usuários (colaboradores)
router.post('/usuarios', autenticar, upload.single('arquivo'), importacaoController.importarUsuarios);

module.exports = router;
