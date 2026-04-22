const axios = require('axios');

async function testarAPI() {
  try {
    console.log('=== TESTANDO API DO DASHBOARD ===\n');

    // Primeiro, fazer login para pegar o token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@wickbold.com.br', // Ajuste o email do superadmin
      senha: 'admin123' // Ajuste a senha
    });

    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso\n');

    // Fazer requisição ao dashboard com o header x-projeto-id
    const dashboardResponse = await axios.get('http://localhost:3001/api/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-projeto-id': '1' // TECH REFRESH LAPTOP 2026
      }
    });

    const { techRefresh } = dashboardResponse.data;

    console.log('📊 TECH REFRESH:');
    console.log(`   Total do Projeto: ${techRefresh.totalProjeto}`);
    console.log(`   Agendadas: ${techRefresh.maquinasAgendadas}`);
    console.log(`   Entregues: ${techRefresh.maquinasEntregues}`);
    console.log(`   Faltam Entregar: ${techRefresh.maquinasFaltamEntregar}`);
    console.log(`   ATRIBUÍDO: ${techRefresh.totalAtribuido}`);

    console.log('\n✅ TESTE CONCLUÍDO!');

    if (techRefresh.totalAtribuido === 34) {
      console.log('\n🎯 BACKEND ESTÁ RETORNANDO 34 CORRETAMENTE!');
      console.log('   O problema é cache do frontend/navegador.');
    } else {
      console.log(`\n❌ BACKEND ESTÁ RETORNANDO ${techRefresh.totalAtribuido} (ERRADO!)`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testarAPI();
