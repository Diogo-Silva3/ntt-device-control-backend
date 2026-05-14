const prisma = require('./src/config/prisma');

async function corrigirH45C9H4StatusProcesso() {
  try {
    console.log('=== CORRIGINDO STATUS PROCESSO H45C9H4 ===');
    console.log('👤 Usuária: Elaine Lopes Dos Santos');
    console.log('📱 Projeto: TECH REFRESH LAPTOP 2026\n');

    // Buscar o equipamento H45C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      include: {
        vinculacao: {
          include: {
            usuario: true,
            projeto: true
          }
        }
      }
    });

    if (!equipamento) {
      console.log('❌ H45C9H4 não encontrado');
      return;
    }

    console.log('📋 STATUS ATUAL:');
    console.log(`   Serial: ${equipamento.serialNumber}`);
    console.log(`   Status: ${equipamento.status}`);
    console.log(`   Status Processo: ${equipamento.statusProcesso}`);
    
    if (equipamento.vinculacao) {
      console.log(`   Usuário: ${equipamento.vinculacao.usuario?.nome || 'N/A'}`);
      console.log(`   Projeto: ${equipamento.vinculacao.projeto?.nome || 'N/A'}`);
    }

    // Verificar se precisa corrigir
    if (equipamento.status === 'EM_USO' && equipamento.statusProcesso === 'Agendado para Entrega') {
      console.log('\n🔧 CORRIGINDO STATUS PROCESSO...');
      
      const resultado = await prisma.equipamento.update({
        where: { id: equipamento.id },
        data: {
          statusProcesso: 'Entregue ao Usuário, Em Uso'
        }
      });

      console.log('✅ STATUS PROCESSO CORRIGIDO!');
      console.log(`   Antes: Agendado para Entrega`);
      console.log(`   Depois: ${resultado.statusProcesso}`);
      
      // Verificar contadores do dashboard
      console.log('\n📊 VERIFICANDO CONTADORES...');
      
      const agendados = await prisma.equipamento.count({
        where: {
          vinculacao: {
            projeto: { nome: 'TECH REFRESH LAPTOP 2026' }
          },
          statusProcesso: 'Agendado para Entrega'
        }
      });

      const entregues = await prisma.equipamento.count({
        where: {
          vinculacao: {
            projeto: { nome: 'TECH REFRESH LAPTOP 2026' }
          },
          statusProcesso: 'Entregue ao Usuário, Em Uso'
        }
      });

      console.log(`   AGENDADAS: ${agendados}`);
      console.log(`   ENTREGAS: ${entregues}`);
      
    } else if (equipamento.statusProcesso === 'Entregue ao Usuário, Em Uso') {
      console.log('\n✅ H45C9H4 já está com status processo correto!');
    } else {
      console.log(`\n⚠️  Status atual não esperado:`);
      console.log(`   Status: ${equipamento.status}`);
      console.log(`   Status Processo: ${equipamento.statusProcesso}`);
    }

  } catch (error) {
    console.error('❌ ERRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  corrigirH45C9H4StatusProcesso();
}

module.exports = { corrigirH45C9H4StatusProcesso };