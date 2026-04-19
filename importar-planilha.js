const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dados da planilha mapeados manualmente
const dados = [
  { numero: 'INC6035711', criado: '2025-07-15', descricao: 'Troca de handheld - Teclado. -IMS0437511', tecnico: 'ANDRÉ LUCIANO FIORE DE VARGAS', status: 'ENCERRADO', defData: '2025-11-21', defConf: '2025-11-28', solNF: '2025-11-28', emNF: '2025-12-05', solColeta: '2025-12-05', coleta: '2025-12-08', previsao: '2025-12-11', chegada: '2025-12-15', entrega: '2025-12-15', obs: 'Entregue a localidade agendado troca de equipamento 21-01 as 11:00', unidade: 'WICKBOLD' },
  { numero: 'INC6046350', criado: '2025-07-23', descricao: 'Troca de Desktop - não liga - Rio de Janeiro', tecnico: 'HERICLES FIRMINO DA SILVA ROZENDO', status: 'ENCERRADO', defData: '2025-12-02', defConf: '2025-12-03', solNF: '2025-12-03', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', unidade: 'RIO DE JANEIRO' },
  { numero: 'INC6054367', criado: '2025-07-29', descricao: 'Troca de Coletor - não funciona - Pouso Alegre', tecnico: 'DOUGLAS CANDIDO MONTEIRO', status: 'ENCERRADO', defData: '2025-12-08', defConf: '2025-12-10', solNF: '2025-12-10', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'TAF-251201 aguardando transferência de ativo', unidade: 'POUSO ALEGRE' },
  { numero: 'INC6063889', criado: '2025-08-05', descricao: 'Troca de Nobreak - Rio de Janeiro', tecnico: 'HERICLES FIRMINO DA SILVA ROZENDO', status: 'ENCERRADO', defData: '2025-12-03', solNF: '2025-12-05', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'Aguardando NF de Devolução', unidade: 'RIO DE JANEIRO' },
  { numero: 'INC6071177', criado: '2025-08-11', descricao: 'Troca de Desktop - Lentidão - Inhauma', tecnico: 'HERICLES FIRMINO DA SILVA ROZENDO', status: 'ENCERRADO', defData: '2025-12-04', defConf: '2025-12-05', solNF: '2025-12-08', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'TAF-251203 aguardando transferência de ativo', unidade: 'RIO DE JANEIRO / CV INHAUMA' },
  { numero: 'TASK1553878', criado: '2025-08-13', descricao: 'Solicitação de Desktop - Raposo', tecnico: 'DANILLO DA SILVA OLIVEIRA', status: 'ENCERRADO', defData: '2025-12-08', defConf: '2025-12-08', solNF: '2025-12-08', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'TAF-251202 aguardando transferência de ativo', unidade: 'RAPOSO' },
  { numero: 'INC6076364', criado: '2025-08-14', descricao: 'Tela desligando - Raposo', tecnico: 'DANILLO DA SILVA OLIVEIRA', status: 'ENCERRADO', defData: '2025-12-16', defConf: '2025-12-16', solNF: '2025-12-16', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'Número do Ticket: 1734', unidade: 'RAPOSO' },
  { numero: 'TASK1554877', criado: '2025-08-14', descricao: 'Solicitação de Tablet - Raposo', tecnico: 'DANILLO DA SILVA OLIVEIRA', status: 'ENCERRADO', defData: '2025-12-16', defConf: '2025-12-16', solNF: '2025-12-16', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'Número do Ticket: 1734', unidade: 'RAPOSO' },
  { numero: 'TASK1554879', criado: '2025-08-14', descricao: 'Solicitação de Desktop - Raposo', tecnico: 'DANILLO DA SILVA OLIVEIRA', status: 'ENCERRADO', defData: '2025-12-18', defConf: '2025-12-18', solNF: '2025-12-18', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'Ticket: 1749', unidade: 'RAPOSO' },
  { numero: 'INC6076975', criado: '2025-08-14', descricao: 'Laptop | Teclado não funciona bem', tecnico: 'DANILLO DA SILVA OLIVEIRA', status: 'ENCERRADO', defData: '2025-12-19', defConf: '2025-12-22', solNF: '2025-12-22', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'Ticket: 1826', unidade: 'RAPOSO' },
  { numero: 'INC6076404', criado: '2025-08-14', descricao: 'Troca de Coletor - Travando - Mega Rio', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'ENCERRADO', defData: '2025-12-18', defConf: '2025-12-29', solNF: '2025-12-29', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', unidade: 'MEGAR RIO' },
  { numero: 'INC6076411', criado: '2025-08-14', descricao: 'Troca de Coletor - Teclado ruim - Mega Rio', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'ENCERRADO', defData: '2025-12-17', defConf: '2025-12-16', solNF: '2025-12-16', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', obs: 'Número do Ticket: 1734', unidade: 'MEGAR RIO' },
  { numero: 'TASK1555155', criado: '2025-08-15', descricao: 'Solicitação de Laptop - Gravatai', tecnico: 'ANDRÉ LUCIANO FIORE DE VARGAS', status: 'ENCERRADO', defData: '2025-12-17', defConf: '2025-12-16', solNF: '2025-12-16', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', unidade: 'GRAVATAI' },
  { numero: 'INC6082055', criado: '2025-08-18', descricao: 'troca de Laptop - Osasco', tecnico: 'SERGIO ADRIANO DA SILVA OLIVEIRA', status: 'ENCERRADO', defData: '2025-12-17', defConf: '2025-12-16', solNF: '2025-12-16', emNF: '2026-01-07', solColeta: '2026-01-07', coleta: '2026-01-12', unidade: 'OSASCO E JAGUARÉ' },
  { numero: 'INC6081547', criado: '2025-08-18', descricao: 'Troca de Laptop | Muito lento - CV Santo Andre', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'ENCERRADO', defData: '2026-01-05', defConf: '2026-01-06', solNF: '2026-01-06', obs: 'Cobrado 12/01', unidade: 'CV SANTO ANDRÉ' },
  { numero: 'TASK1556399', criado: '2025-08-19', descricao: 'Solicitação de Desktop - Pouso Alegre', tecnico: 'CARLOS HENRIQUE', status: 'ENCERRADO', defData: '2026-01-05', defConf: '2026-01-06', solNF: '2026-01-06', obs: 'Aguardando NF - Ticket nº 2029', unidade: 'POUSO ALEGRE' },
  { numero: 'TASK1556283', criado: '2025-08-19', descricao: 'Solicitação de Laptop - Raposo', tecnico: 'HERICLES FIRMINO DA SILVA ROZENDO', status: 'ENCERRADO', defData: '2026-01-07', defConf: '2026-01-08', solNF: '2026-01-08', obs: 'Cobrado 12/01', unidade: 'RAPOSO' },
  { numero: 'TASK1643566', criado: '2026-03-09', descricao: 'Desktop - Liga Nao - CV Valinhos', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'EM_ANDAMENTO', defData: '2026-03-11', defConf: '2026-03-11', solNF: '2026-03-12', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', obs: 'Solicitação de Ativo aprovada 06/04, aguardando Nota fiscal', unidade: 'CV VALINHOS' },
  { numero: 'TASK1644151', criado: '2026-03-10', descricao: 'Solicitação de Laptop - Juiz de Fora', tecnico: 'ALEXSANDRO MESCOLIN', status: 'EM_ANDAMENTO', defData: '2026-03-10', defConf: '2026-03-11', solNF: '2026-03-11', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', obs: 'TAF 260311 Cobrado 16/03', unidade: 'JUÍZ DE FORA' },
  { numero: 'TASK1644786', criado: '2026-03-11', descricao: 'Solicitação de Laptop - CV Brasilia', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'EM_ANDAMENTO', defData: '2026-03-11', defConf: '2026-03-16', solNF: '2026-03-16', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', obs: 'Cobrado 19/03', unidade: 'CV BRASÍLIA' },
  { numero: 'TASK1646077', criado: '2026-03-13', descricao: 'Troca de Coletor - Planta Brasília', tecnico: 'MATHEUS DE OLIVEIRA SAMPAIO', status: 'EM_ANDAMENTO', defData: '2026-03-16', defConf: '2026-03-17', solNF: '2026-03-17', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', obs: 'TAF 260315 Cobrado 24/03', unidade: 'BRASILIA' },
  { numero: 'TASK1646080', criado: '2026-03-13', descricao: 'Troca de Coletor - Planta Brasília', tecnico: 'MATHEUS DE OLIVEIRA SAMPAIO', status: 'EM_ANDAMENTO', defData: '2026-03-16', defConf: '2026-03-17', solNF: '2026-03-17', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', obs: 'TAF 260315 Cobrado 24/03', unidade: 'BRASILIA' },
  { numero: 'INC6323677', criado: '2026-03-16', descricao: 'Impressora WMS - Planta Brasília', tecnico: 'MATHEUS DE OLIVEIRA SAMPAIO', status: 'EM_ANDAMENTO', defData: '2026-03-16', defConf: '2026-03-17', solNF: '2026-03-17', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', obs: 'TAF 260316 Cobrado 24/03', unidade: 'BRASILIA' },
  { numero: 'TASK1647574', criado: '2026-03-17', descricao: 'Solicitação de Laptop - Mega Rio', tecnico: 'AFFONSO CAMPOS MEDEIROS', status: 'EM_ANDAMENTO', defData: '2026-03-18', defConf: '2026-03-20', solNF: '2026-03-20', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', obs: 'Cobrado 01/04', unidade: 'MEGAR RIO' },
  { numero: 'TASK1649313', criado: '2026-03-20', descricao: 'Laptop não esta segurando carga (Bateria) - Mogi das Cruzes', tecnico: 'KELVE RABELO FARIAS (PARCEIRO)', status: 'EM_ANDAMENTO', defData: '2026-03-20', defConf: '2026-03-23', solNF: '2026-03-23', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', obs: 'Aguardando coleta, solicitado 10/04', unidade: 'MOGI' },
  { numero: 'INC6328479', criado: '2026-03-20', descricao: 'Troca de Laptop - Jaguariuna', tecnico: 'LUIS HENRIQUE DOS SANTOS', status: 'EM_ANDAMENTO', defData: '2026-03-30', defConf: '2026-04-02', solNF: '2026-04-02', emNF: '2026-04-08', solColeta: '2026-04-08', coleta: '2026-04-13', unidade: 'JAGUARIÚNA' },
  { numero: 'INC6328565', criado: '2026-03-20', descricao: 'Troca de Desktop - CEVE IGARASSU', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'EM_ANDAMENTO', defData: '2026-03-25', defConf: '2026-03-31', solNF: '2026-03-31', obs: 'Cobrado pela Jeniffer em 16/04', unidade: 'CV IGARASSU' },
  { numero: 'TASK1653348', criado: '2026-03-29', descricao: 'Solicitação de Laptop - CV Guarulhos', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'EM_ANDAMENTO', defData: '2026-03-31', defConf: '2026-04-06', solNF: '2026-04-06', obs: 'Cobrado pela Jeniffer em 16/04', unidade: 'CV GUARULHOS' },
  { numero: 'TASK1654871', criado: '2026-04-01', descricao: 'NARS - Solicitalçao de troca de Tablet - Brasilia', tecnico: 'MATHEUS DE OLIVEIRA SAMPAIO', status: 'EM_ANDAMENTO', defData: '2026-04-06', defConf: '2026-04-07', solNF: '2026-04-07', emNF: '2026-04-09', solColeta: '2026-04-10', coleta: '2026-04-13', unidade: 'BRASILIA' },
  { numero: 'TASK1655311', criado: '2026-04-01', descricao: 'Solicitação de Laptop - Raposo', tecnico: 'DIEGO PEREIRA VIEIRA', status: 'EM_ANDAMENTO', defData: '2026-04-02', defConf: '2026-04-14', chegada: '2026-04-14', unidade: 'RAPOSO' },
  { numero: 'TASK1657844', criado: '2026-04-08', descricao: 'Solicitação de Desktop - CV Santo Andre', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'EM_ANDAMENTO', defData: '2026-04-08', defConf: '2026-04-09', solNF: '2026-04-09', unidade: 'CV SANTO ANDRÉ' },
  { numero: 'TASK1657845', criado: '2026-04-08', descricao: 'Solicitação de Desktop - CV Santo Andre', tecnico: 'THIAGO CORREA LIMA FERREIRA', status: 'EM_ANDAMENTO', defData: '2026-04-08', defConf: '2026-04-09', solNF: '2026-04-09', unidade: 'CV SANTO ANDRÉ' },
  { numero: 'TASK1657868', criado: '2026-04-08', descricao: 'Solicitação de Laptop - Jaguaré', tecnico: 'DOUGLAS CANDIDO MONTEIRO', status: 'EM_ANDAMENTO', defData: '2026-04-08', defConf: '2026-04-09', unidade: 'OSASCO E JAGUARÉ' },
  { numero: 'TASK1655883', criado: '2026-04-02', descricao: 'Solicitação de Coletor - Mogi das Cruzes', tecnico: 'KELVE RABELO FARIAS (PARCEIRO)', status: 'EM_ANDAMENTO', defData: '2026-04-06', defConf: '2026-04-06', solNF: '2026-04-07', obs: 'Cobrado 16/04', unidade: 'MOGI' },
  { numero: 'TASK1659948', criado: '2026-04-12', descricao: 'Solicitação de Laptop - Raposo', tecnico: 'PEDRO SEVERO', status: 'EM_ANDAMENTO', defData: '2026-04-14', defConf: '2026-04-15', unidade: 'RAPOSO' },
  { numero: 'TASK1659961', criado: '2026-04-12', descricao: 'Solicitação de Laptop - Raposo', tecnico: 'PEDRO SEVERO', status: 'EM_ANDAMENTO', defData: '2026-04-13', defConf: '2026-04-14', unidade: 'RAPOSO' },
  { numero: 'TASK1659962', criado: '2026-04-12', descricao: 'Solicitação de Laptop - Raposo', tecnico: 'LUCAS MARUL', status: 'EM_ANDAMENTO', defData: '2026-04-15', defConf: '2026-04-16', unidade: 'RAPOSO' },
  { numero: 'TASK1659963', criado: '2026-04-12', descricao: 'NARS - Solicitação de Desktop - Raposo', tecnico: 'DIEGO PEREIRA VIEIRA', status: 'EM_ANDAMENTO', defData: '2026-04-14', defConf: '2026-04-16', unidade: 'RAPOSO' },
  { numero: 'TASK1659964', criado: '2026-04-12', descricao: 'Solicitação de Laptop - Raposo', tecnico: 'PEDRO SEVERO', status: 'EM_ANDAMENTO', defData: '2026-04-13', defConf: '2026-04-14', unidade: 'RAPOSO' },
  { numero: 'TASK1659974', criado: '2026-04-12', descricao: 'NARS - Solicitação de Laptop - Recife', tecnico: 'DIOGO JOSE DA SILVA', status: 'EM_ANDAMENTO', obs: 'Solicitando Dados', unidade: 'WICKBOLD' },
  { numero: 'INC6355427', criado: '2026-04-13', descricao: 'Solicitação de periféricos - Gravatai', tecnico: 'ANDRÉ LUCIANO FIORE DE VARGAS', status: 'EM_ANDAMENTO', defData: '2026-04-13', defConf: '2026-04-14', solNF: '2026-04-14', unidade: 'GRAVATAI' },
  { numero: 'TASK1660579', criado: '2026-04-13', descricao: 'Solicitação de Laptop - Raposo', tecnico: 'LUCAS MARUL', status: 'EM_ANDAMENTO', defData: '2026-04-14', defConf: '2026-04-16', unidade: 'RAPOSO' },
  { numero: 'INC6356945', criado: '2026-04-14', descricao: 'Desktop - Tela Preta - Raposo', tecnico: 'PEDRO SEVERO', status: 'EM_ANDAMENTO', defData: '2026-04-15', defConf: '2026-04-16', unidade: 'RAPOSO' },
];

function parseDate(str) {
  if (!str) return null;
  try { return new Date(str); } catch { return null; }
}

function derivarTipo(descricao) {
  const d = (descricao || '').toUpperCase();
  if (d.includes('RETORNO') || d.includes('DEVOLUCAO')) return 'RETORNO';
  if (d.includes('TROCA')) return 'TROCA';
  if (d.includes('ENVIO')) return 'ENVIO';
  return 'NOVO';
}

function derivarEstado(d) {
  if (d.entrega) return 'Entregue';
  if (d.chegada) return 'Aguardando Entrega';
  if (d.coleta) return 'Em Trânsito';
  if (d.solColeta) return 'Coleta Solicitada';
  if (d.emNF) return 'Aguardando Coleta';
  if (d.solNF) return 'NF Solicitada';
  if (d.defData) return 'Aguardando NF';
  return 'Aberto';
}

async function main() {
  const empresa = await prisma.empresa.findFirst({ orderBy: { id: 'asc' } });
  console.log('Empresa:', empresa.nome, '| ID:', empresa.id);

  const usuarios = await prisma.usuario.findMany({ where: { empresaId: empresa.id, ativo: true } });
  const unidades = await prisma.unidade.findMany({ where: { empresaId: empresa.id } });

  const findTecnico = (nome) => {
    const n = nome.toUpperCase();
    return usuarios.find(u => u.nome.toUpperCase().includes(n.split(' ')[0]) && u.nome.toUpperCase().includes(n.split(' ')[n.split(' ').length - 1]));
  };

  const findUnidade = (nome) => {
    if (!nome) return unidades[0];
    const n = nome.toUpperCase();
    return unidades.find(u => u.nome.toUpperCase().includes(n) || n.includes(u.nome.toUpperCase())) || unidades[0];
  };

  let criados = 0, pulados = 0, erros = 0;

  for (const d of dados) {
    try {
      // Verifica se já existe
      const existe = await prisma.solicitacaoAtivo.findFirst({
        where: { numeroChamado: d.numero, empresaId: empresa.id }
      });
      if (existe) { console.log('Já existe:', d.numero); pulados++; continue; }

      const tecnico = findTecnico(d.tecnico);
      if (!tecnico) { console.log('Técnico não encontrado:', d.tecnico); erros++; continue; }

      const unidade = findUnidade(d.unidade);
      const estado = derivarEstado(d);
      const tipo = derivarTipo(d.descricao);

      await prisma.solicitacaoAtivo.create({
        data: {
          numeroChamado: d.numero,
          descricao: d.descricao || null,
          observacoes: d.obs || null,
          tipo,
          status: d.status || 'ENCERRADO',
          estado,
          tecnicoId: tecnico.id,
          unidadeId: unidade.id,
          empresaId: empresa.id,
          importado: true,
          dataCriacao: parseDate(d.criado) || new Date(),
          dataDefinicao: parseDate(d.defData),
          dataDefinicaoConfirmada: parseDate(d.defConf),
          dataSolicitacaoNF: parseDate(d.solNF),
          dataEmissaoNF: parseDate(d.emNF),
          dataSolicitacaoColeta: parseDate(d.solColeta),
          dataColeta: parseDate(d.coleta),
          previsaoChegada: parseDate(d.previsao),
          dataChegada: parseDate(d.chegada),
          dataEntrega: parseDate(d.entrega),
        }
      });
      console.log('Criado:', d.numero, '-', d.descricao?.substring(0, 40));
      criados++;
    } catch (err) {
      console.log('Erro em', d.numero, ':', err.message);
      erros++;
    }
  }

  console.log(`\nConcluido! Criados: ${criados} | Pulados: ${pulados} | Erros: ${erros}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
