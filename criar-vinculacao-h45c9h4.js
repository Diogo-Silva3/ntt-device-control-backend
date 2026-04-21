const prisma = require('./src/config/prisma');

async function criar() {
  try {
    console.log('=== Criando vinculação para H45C9H4 ===\n');
    
    // Buscar ELAINE
    const elaine = await prisma.usuario.findFirst({
      where: { 
        nome: { contains: 'ELAINE' }
      }
    });
    
    if (!elaine) {
      console.log('ELAINE não encontrada');
      return;
    }
    
    console.log(`ELAINE encontrada - ID: ${elaine.id}\n`);
    
    // Buscar H45C9H4
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });
    
    if (!eq) {
      console.log('H45C9H4 não encontrado');
      return;
    }
    
    console.log(`H45C9H4 encontrado - ID: ${eq.id}\n`);
    
    // Buscar PEDRO SEVERO (técnico)
    const pedro = await prisma.usuario.findFirst({
      where: { 
        nome: { contains: 'PEDRO SEVERO' }
      }
    });
    
    if (!pedro) {
      console.log('PEDRO SEVERO não encontrado');
      return;
    }
    
    console.log(`PEDRO SEVERO encontrado - ID: ${pedro.id}\n`);
    
    // Verificar se já existe vinculação ativa
    const vinculacaoExistente = await prisma.vinculacao.findFirst({
      where: {
        equipamentoId: eq.id,
        usuarioId: elaine.id,
        ativa: true
      }
    });
    
    if (vinculacaoExistente) {
      console.log('✓ Vinculação ativa já existe');
      return;
    }
    
    // Criar vinculação
    const vinculacao = await prisma.vinculacao.create({
      data: {
        equipamentoId: eq.id,
        usuarioId: elaine.id,
        tecnicoId: pedro.id,
        statusEntrega: 'PENDENTE',
        ativa: true,
        dataInicio: new Date(),
        dataAgendamento: new Date('2026-04-20T10:00:00')
      },
      include: {
        usuario: true,
        equipamento: true,
        tecnico: true
      }
    });
    
    console.log('✓ Vinculação criada com sucesso!');
    console.log(`- Equipamento: ${vinculacao.equipamento.serialNumber}`);
    console.log(`- Colaborador: ${vinculacao.usuario.nome}`);
    console.log(`- Técnico: ${vinculacao.tecnico.nome}`);
    console.log(`- Status: ${vinculacao.statusEntrega}`);
    console.log(`- Data Agendamento: ${vinculacao.dataAgendamento}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

criar();
