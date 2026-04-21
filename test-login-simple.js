const http = require('http');

const data = JSON.stringify({
  email: 'pedro.severo@gbsupport.net',
  senha: 'Senha@123'
});

const options = {
  hostname: 'tech-refresh.cloud',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = require('https').request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
    try {
      const json = JSON.parse(body);
      console.log('\nResposta completa:');
      console.log(JSON.stringify(json, null, 2));
      if (json.usuario?.projetoId) {
        console.log('\n✅ projetoId:', json.usuario.projetoId);
      } else {
        console.log('\n❌ projetoId não retornado');
      }
    } catch (e) {
      console.log('Erro ao parsear:', e.message);
    }
  });
});

req.on('error', (e) => console.error('Erro:', e.message));
req.write(data);
req.end();
