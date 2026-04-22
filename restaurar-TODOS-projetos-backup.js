require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const execPromise = util.promisify(exec);
const prisma = new PrismaClient();

async function restaurar() {
  try {
    console.log('=== RESTAURANDO TODAS AS VINCULAÇÕES DO BACKUP ===\n');

    const backupFile = '/var/backups/postgres/backup_20260420_020001.sql.gz';
    
    console.log(`📦 Extraindo backup: ${backupFile}`);
    await execPromise(`gunzip -c ${backupFile} > /tmp/backup_full.sql`);
    console.log('✓ Backup extraído\n');

    // Ler o arquivo SQL
    console.log('📖 Lendo dados do backup...');
    const backupContent = await fs.readFile('/tmp/backup_full.sql', 'utf8');
    
    // Encontrar a seção COPY da tabela vinculacoes
    const vinculacoesMatch = backupContent.match(/COPY public\.vinculacoes \((.*?)\) FROM stdin;([\s\S]*?)\\\./);
    
    if (!vinculacoesMatch) {
      console.log('❌ Não foi possível encontrar dados da tabela vinculacoes no backup');
      return;
    }

    const colunas = vinculacoesMatch[1].split(', ');
    const linhas = vinculacoesMatch[2].trim().split('\n');
    
    console.log(`✓ Encontradas ${linhas.length} vinculações no backup`);
    console.log(`   Colunas: ${colunas.join(', ')}\n`);

    // Fazer backup das vinculações atuais
    console.log('💾 Fazendo backup das vinculações atuais...');
    const vinculacoesAtuais = await prisma.vinculacao.findMany();
    console.log(`✓ ${vinculacoesAtuais.length} vinculações salvas em memória\n`);

    // Deletar TODAS as vinculações
    console.log('🗑️  Deletando TODAS as vinculações atuais...');
    await prisma.vinculacao.deleteMany({});
    console.log('✓ Vinculações deletadas\n');

    // Processar e inserir vinculações do backup
    console.log('📥 Restaurando TODAS as vinculações do backup...');
    
    let restauradas = 0;
    let erros = 0;

    for (const linha of linhas) {
      if (!linha.trim()) continue;
      
      const valores = linha.split('\t');
      const vinculacao = {};
      
      colunas.forEach((col, index) => {
        const valor = valores[index];
        if (valor === '\\N' || valor === '') {
          vinculacao[col] = null;
        } else if (col === 'ativa' || col === 'lembrete_enviado') {
          vinculacao[col] = valor === 't';
        } else if (col === 'id' || col === 'usuario_id' || col === 'equipamento_id' || col === 'tecnico_id' || col === 'projeto_id') {
          vinculacao[col] = parseInt(valor);
        } else if (col === 'reagendamentos') {
          vinculacao[col] = valor; // Manter como string
        } else if (col === 'data_inicio' || col === 'data_fim' || col === 'data_agendamento' || col === 'created_at') {
          vinculacao[col] = new Date(valor);
        } else {
          vinculacao[col] = valor;
        }
      });

      try {
        await prisma.vinculacao.create({
          data: {
            id: vinculacao.id,
            usuarioId: vinculacao.usuario_id,
            equipamentoId: vinculacao.equipamento_id,
            tecnicoId: vinculacao.tecnico_id,
            projetoId: vinculacao.projeto_id,
            dataInicio: vinculacao.data_inicio,
            dataFim: vinculacao.data_fim,
            ativa: vinculacao.ativa,
            observacao: vinculacao.observacao,
            numeroChamado: vinculacao.numero_chamado,
            tipoOperacao: vinculacao.tipo_operacao,
            softwaresDe: vinculacao.softwares_de,
            softwaresPara: vinculacao.softwares_para,
            dataAgendamento: vinculacao.data_agendamento,
            reagendamentos: vinculacao.reagendamentos,
            statusEntrega: vinculacao.status_entrega,
            lembreteEnviado: vinculacao.lembrete_enviado || false,
            assinatura: vinculacao.assinatura,
            checklistDevolucao: vinculacao.checklist_devolucao,
            createdAt: vinculacao.created_at,
          },
        });
        restauradas++;
      } catch (e) {
        erros++;
        if (erros <= 5) {
          console.log(`   ⚠️  Erro ao restaurar vinculação ID ${vinculacao.id}: ${e.message}`);
        }
      }
    }

    console.log(`✓ ${restauradas} vinculações restauradas`);
    if (erros > 0) {
      console.log(`   ⚠️  ${erros} erros durante restauração\n`);
    } else {
      console.log('');
    }

    // Verificar resultado por projeto
    console.log('📊 VERIFICAÇÃO FINAL POR PROJETO:\n');
    
    const projetos = await prisma.projeto.findMany({
      include: {
        equipamentos: {
          where: { status: { not: 'DESCARTADO' } },
          include: {
            vinculacoes: {
              where: { ativa: true },
            },
          },
        },
      },
    });

    for (const projeto of projetos) {
      const vinculacoesAtivas = projeto.equipamentos.flatMap(e => e.vinculacoes);
      
      const porStatus = {};
      vinculacoesAtivas.forEach(v => {
        porStatus[v.statusEntrega] = (porStatus[v.statusEntrega] || 0) + 1;
      });

      const entregues = porStatus['ENTREGUE'] || 0;
      const pendentes = porStatus['PENDENTE'] || 0;

      console.log(`${projeto.nome}:`);
      console.log(`   Vinculações ativas: ${vinculacoesAtivas.length}`);
      console.log(`   ENTREGUE: ${entregues}`);
      console.log(`   PENDENTE: ${pendentes}`);
      console.log('');
    }

    console.log('✅ RESTAURAÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restaurar();
