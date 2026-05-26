const testar = async () => {
  try {
    console.log('Testando API de colaboradores...\n');
    
    // Teste 1: Com comAcesso=true (antigo - deve retornar 0)
    console.log('1. Teste com comAcesso=true (ANTIGO - deve retornar 0):');
    try {
      const res1 = await fetch('http://localhost:3000/api/usuarios?role=COLABORADOR&comAcesso=true&limit=10000', {
        headers: { 'Authorization': 'Bearer test' }
      });
      const data1 = await res1.json();
      console.log(`   Total: ${data1.total}, Retornados: ${data1.data.length}\n`);
    } catch (e) {
      console.log(`   Erro: ${e.message}\n`);
    }
    
    // Teste 2: Sem comAcesso (novo - deve retornar 678)
    console.log('2. Teste SEM comAcesso (NOVO - deve retornar 678):');
    try {
      const res2 = await fetch('http://localhost:3000/api/usuarios?role=COLABORADOR&limit=10000', {
        headers: { 'Authorization': 'Bearer test' }
      });
      const data2 = await res2.json();
      console.log(`   Total: ${data2.total}, Retornados: ${data2.data.length}\n`);
      
      if (data2.data.length > 0) {
        console.log('3. Primeiros 5 colaboradores:');
        data2.data.slice(0, 5).forEach((c, i) => {
          console.log(`   ${i+1}. ${c.nome} (ID: ${c.id})`);
        });
      }
    } catch (e) {
      console.log(`   Erro: ${e.message}\n`);
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  }
};

testar();
