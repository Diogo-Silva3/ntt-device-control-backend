const mysql = require('mysql2/promise');
require('dotenv').config();

const numerosSerieString = `358680812647185358680812647201358680812653332358680812653993358680812654579358680812653464358680812653191358680812654231358680812653381358680812653779358680812636147358680812652813358680812647235358680812643093358680812676630358680812678677358680812634399358680812692603358680812633185358680812676184358680812649702358680812641659358680812634704358680812647359358680812654496358680812674775358680812646542358680812649777358680812666730358680812634761358680812668058358680812646443358680812676150358680812654587358680812666763358680812654249358680812679907358680812671797`;

// Dividir em números de série individuais (cada um tem 15 caracteres)
const numerosSerie = [];
for (let i = 0; i < numerosSerieString.length; i += 15) {
  numerosSerie.push(numerosSerieString.substring(i, i + 15));
}

async function verificar() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'inventario_ti'
  });

  try {
    console.log(`🔍 Verificando ${numerosSerie.length} celulares no banco local...\n`);

    const placeholders = numerosSerie.map(() => '?').join(',');
    const query = `
      SELECT 
        e.id,
        e.numero_serie,
        e.marca,
        e.modelo,
        e.tipo,
        e.status,
        p.nome as projeto,
        u.nome as unidade
      FROM equipamentos e
      LEFT JOIN projetos p ON e.projeto_id = p.id
      LEFT JOIN unidades u ON e.unidade_id = u.id
      WHERE e.numero_serie IN (${placeholders})
      ORDER BY e.numero_serie
    `;

    const [rows] = await connection.execute(query, numerosSerie);

    console.log(`✅ Encontrados: ${rows.length} celulares\n`);

    if (rows.length > 0) {
      console.table(rows);

      // Resumo por projeto
      const porProjeto = {};
      rows.forEach(r => {
        const proj = r.projeto || 'Sem Projeto';
        porProjeto[proj] = (porProjeto[proj] || 0) + 1;
      });

      console.log('\n📊 Resumo por Projeto:');
      Object.entries(porProjeto).forEach(([proj, qtd]) => {
        console.log(`   ${proj}: ${qtd}`);
      });

      // Resumo por status
      const porStatus = {};
      rows.forEach(r => {
        porStatus[r.status] = (porStatus[r.status] || 0) + 1;
      });

      console.log('\n📊 Resumo por Status:');
      Object.entries(porStatus).forEach(([status, qtd]) => {
        console.log(`   ${status}: ${qtd}`);
      });
    } else {
      console.log('❌ Nenhum celular encontrado com esses números de série');
    }

    // Verificar faltando
    const encontrados = rows.map(r => r.numero_serie);
    const faltando = numerosSerie.filter(ns => !encontrados.includes(ns));

    console.log(`\n📊 Resumo Final:`);
    console.log(`   Total a verificar: ${numerosSerie.length}`);
    console.log(`   Encontrados: ${encontrados.length}`);
    console.log(`   Faltando: ${faltando.length}`);

    if (faltando.length > 0 && faltando.length <= 10) {
      console.log('\n❌ Números de série faltando:');
      console.log(faltando.join(', '));
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

verificar();
