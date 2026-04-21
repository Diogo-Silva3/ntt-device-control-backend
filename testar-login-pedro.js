const axios = require('axios');

const api = axios.create({
  baseURL: 'https://tech-refresh.cloud/api',
  timeout: 10000,
});

async function testarLogin() {
  try {
    console.log('Testando login do PEDRO SEVERO (pedro.severo@gbsupport.net)...\n');
    const res = await api.post('/auth/login', {
      email: 'pedro.severo@gbsupport.net',
      senha: 'Senha@123'
    });

    console.log('✅ Login bem-sucedido!');
    console.log('\nDados do usuário retornados:');
    console.log(JSON.stringify(res.data.usuario, null, 2));

    if (res.data.usuario.projetoId) {
      console.log('\n✅ projetoId está sendo retornado:', res.data.usuario.projetoId);
    } else {
      console.log('\n❌ projetoId NÃO está sendo retornado!');
    }
  } catch (err) {
    console.error('❌ Erro ao fazer login:', err.response?.data || err.message);
  }
}

testarLogin();
