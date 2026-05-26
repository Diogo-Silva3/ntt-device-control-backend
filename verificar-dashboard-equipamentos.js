const mongoose = require('mongoose');
require('dotenv').config();

const equipamentoSchema = new mongoose.Schema({}, { strict: false });
const Equipment = mongoose.model('Equipment', equipamentoSchema, 'equipamentos');

async function verificar() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tech-refresh';
    await mongoose.connect(uri);
    console.log('Conectado ao MongoDB');

    const novo = await Equipment.countDocuments({ statusProcesso: 'Novo' });
    const imagemInstalada = await Equipment.countDocuments({ statusProcesso: 'Imagem Instalada' });
    const softwaresInstalados = await Equipment.countDocuments({ statusProcesso: 'Softwares Instalados' });
    const assetRegistrado = await Equipment.countDocuments({ statusProcesso: 'Asset Registrado' });
    const agendadoEntrega = await Equipment.countDocuments({ statusProcesso: 'Agendado para Entrega' });
    const entregueUsuario = await Equipment.countDocuments({ statusProcesso: 'Entregue ao Usuário' });
    
    const total = novo + imagemInstalada + softwaresInstalados + assetRegistrado + agendadoEntrega + entregueUsuario;

    console.log('\n=== DASHBOARD COUNTS ===');
    console.log('Novo:', novo);
    console.log('Imagem Instalada:', imagemInstalada);
    console.log('Softwares Instalados:', softwaresInstalados);
    console.log('Asset Registrado:', assetRegistrado);
    console.log('Agendado para Entrega:', agendadoEntrega);
    console.log('Entregue ao Usuário:', entregueUsuario);
    console.log('------------------------');
    console.log('TOTAL:', total);

    await mongoose.connection.close();
    process.exit(0);
  } catch(err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

verificar();
