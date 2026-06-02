const mysql = require('mysql2/promise');
require('dotenv').config();

const numerosSerieString = `BFMYDJ4J4MYDJ46DMYDJ42FMYDJ48FMYDJ43HMYDJ4C5MYDJ44K7HDJ4H5MYDJ4D4MYDJ435MYDJ484MYDJ485MYDJ42K7HDJ426MYDJ495MYDJ49K7HDJ494MYDJ47GMYDJ41JMYDJ4HFMYDJ44DMYDJ47DMYDJ4DDMYDJ48DMYDJ4FDMYDJ4D5MYDJ4JFMYDJ4BGMYDJ4B5MYDJ4B4MYDJ45GMYDJ45CMYDJ43CMYDJ4GDMYDJ4G4MYDJ45K7HDJ415MYDJ47J7HDJ4GCMYDJ4CGMYDJ474MYDJ4HDMYDJ4BDMYDJ4JDMYDJ44FMYDJ46GMYDJ45FMYDJ47FMYDJ4FFMYDJ44GMYDJ4CDMYDJ46HMYDJ4DFMYDJ43GMYDJ4FHMYDJ41FMYDJ4DCMYDJ41GMYDJ43DMYDJ49FMYDJ4GFMYDJ4FCMYDJ4FGMYDJ44CMYDJ42DMYDJ41BMYDJ4F8MYDJ465MYDJ4`;

// Dividir em números de série individuais (cada um tem 8 caracteres)
const numerosSerie = [];
for (let i = 0; i < numerosSerieString.length; i += 8) {
  numerosSerie.push(numerosSerieString.substring(i, i + 8));
}

console.log(`Total de números de série a verificar: ${numerosSerie.length}`);
console.log(`Primeiros 5: ${numerosSerie.slice(0, 5).join(', ')}`);
console.log('');

async function verificarDesktops() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Buscar equipamentos no projeto TECH REFRESH DESKTOP 2026
    const query = `
      SELECT 
        e.id,
        e.numero_serie,
        e.marca,
        e.modelo,
        e.status,
        p.nome as projeto
      FROM equipamentos e
      LEFT JOIN projetos p ON e.projeto_id = p.id
      WHERE p.nome = 'TECH REFRESH DESKTOP 2026'
      AND e.numero_serie IN (${numerosSerie.map(() => '?').join(',')})
      ORDER BY e.numero_serie
    `;

    const [rows] = await connection.execute(query, numerosSerie);

    console.log(`✅ Equipamentos encontrados no projeto: ${rows.length}`);
    console.log('');

    if (rows.length > 0) {
      console.table(rows);
    } else {
      console.log('❌ Nenhum equipamento encontrado com esses números de série no projeto TECH REFRESH DESKTOP 2026');
    }

    // Verificar quantos estão faltando
    const encontrados = rows.map(r => r.numero_serie);
    const faltando = numerosSerie.filter(ns => !encontrados.includes(ns));

    console.log('');
    console.log(`📊 Resumo:`);
    console.log(`   - Total a verificar: ${numerosSerie.length}`);
    console.log(`   - Encontrados: ${encontrados.length}`);
    console.log(`   - Faltando: ${faltando.length}`);

    if (faltando.length > 0 && faltando.length <= 20) {
      console.log('');
      console.log('Números de série faltando:');
      console.log(faltando.join(', '));
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

verificarDesktops();
