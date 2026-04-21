const http = require('http');

// Dados para atribuir projeto ao técnico
const data = JSON.stringify({
  projetoId: 1 // Será ajustado após descobrir o ID correto
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/usuarios/161', // ID do técnico PEDRO SEVERO
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer seu-token-aqui' // Será necessário um token válido
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Erro:', error.message);
});

req.write(data);
req.end();
