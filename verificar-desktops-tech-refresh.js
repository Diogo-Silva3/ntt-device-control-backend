const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
});

const serialNumbers = [
  'BFMYDJ4', 'J4MYDJ4', '6DMYDJ4', '2FMYDJ4', '8FMYDJ4', '3HMYDJ4', 'C5MYDJ4', '4K7HDJ4', 'H5MYDJ4', 'D4MYDJ4',
  '35MYDJ4', '84MYDJ4', '85MYDJ4', '2K7HDJ4', '26MYDJ4', '95MYDJ4', '9K7HDJ4', '94MYDJ4', '7GMYDJ4', '1JMYDJ4',
  'HFMYDJ4', '4DMYDJ4', '7DMYDJ4', 'DDMYDJ4', '8DMYDJ4', 'FDMYDJ4', 'D5MYDJ4', 'JFMYDJ4', 'BGMYDJ4', 'B5MYDJ4',
  'B4MYDJ4', '5GMYDJ4', '5CMYDJ4', '3CMYDJ4', 'GDMYDJ4', 'G4MYDJ4', '5K7HDJ4', '15MYDJ4', '7J7HDJ4', 'GCMYDJ4',
  'CGMYDJ4', '74MYDJ4', 'HDMYDJ4', 'BDMYDJ4', 'JDMYDJ4', '4FMYDJ4', '6GMYDJ4', '5FMYDJ4', '7FMYDJ4', 'FFMYDJ4',
  '4GMYDJ4', 'CDMYDJ4', '6HMYDJ4', 'DFMYDJ4', '3GMYDJ4', 'FHMYDJ4', '1FMYDJ4', 'DCMYDJ4', '1GMYDJ4', '3DMYDJ4',
  '9FMYDJ4', 'GFMYDJ4', 'FCMYDJ4', 'FGMYDJ4', '4CMYDJ4', '2DMYDJ4', '1BMYDJ4', 'F8MYDJ4', '65MYDJ4'
];

async function verificarDesktops() {
  try {
    console.log(`\n🔍 Verificando ${serialNumbers.length} números de série de desktops...\n`);

    // Get project ID for "Tech refresh desktop 2026"
    const projectResult = await pool.query(
      `SELECT id FROM projetos WHERE nome = 'TECH REFRESH DESKTOP 2026'`
    );

    if (projectResult.rows.length === 0) {
      console.log('❌ Projeto "TECH REFRESH DESKTOP 2026" não encontrado');
      await pool.end();
      return;
    }

    const projectId = projectResult.rows[0].id;
    console.log(`✅ Projeto encontrado: ID ${projectId}\n`);

    // Check which serial numbers exist in the project
    const placeholders = serialNumbers.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT 
        e.numero_serie,
        e.marca,
        e.modelo,
        e.tipo,
        u.nome as unidade,
        p.nome as projeto
      FROM equipamentos e
      LEFT JOIN unidades u ON e.unidade_id = u.id
      LEFT JOIN projetos p ON e.projeto_id = p.id
      WHERE e.numero_serie IN (${placeholders})
      AND e.projeto_id = $${serialNumbers.length + 1}
      ORDER BY e.numero_serie
    `;

    const result = await pool.query(query, [...serialNumbers, projectId]);

    console.log(`📊 RESULTADO DA VERIFICAÇÃO:`);
    console.log(`   Total de séries verificadas: ${serialNumbers.length}`);
    console.log(`   Encontradas no projeto: ${result.rows.length}`);
    console.log(`   Não encontradas: ${serialNumbers.length - result.rows.length}\n`);

    if (result.rows.length > 0) {
      console.log(`✅ DESKTOPS ENCONTRADOS NO PROJETO:\n`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.numero_serie}`);
        console.log(`   Marca: ${row.marca}`);
        console.log(`   Modelo: ${row.modelo}`);
        console.log(`   Tipo: ${row.tipo}`);
        console.log(`   Unidade: ${row.unidade || 'N/A'}`);
        console.log(`   Projeto: ${row.projeto}`);
        console.log('');
      });
    }

    // Show which ones are missing
    const foundSerials = result.rows.map(r => r.numero_serie);
    const missingSerials = serialNumbers.filter(s => !foundSerials.includes(s));

    if (missingSerials.length > 0) {
      console.log(`\n❌ DESKTOPS NÃO ENCONTRADOS NO PROJETO (${missingSerials.length}):\n`);
      missingSerials.forEach((serial, index) => {
        console.log(`${index + 1}. ${serial}`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verificarDesktops();
