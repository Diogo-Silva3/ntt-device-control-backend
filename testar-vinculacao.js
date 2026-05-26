const API_URL = 'http://localhost:3001/api';
let token = '';
let equipamentoId = null;
let colaboradorId = null;

async function fazerRequisicao(metodo, url, dados = null) {
  const opcoes = {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  if (dados) {
    opcoes.body = JSON.stringify(dados);
  }
  
  const res = await fetch(url, opcoes);
  const json = await res.json();
  
  if (!res.ok) {
    throw new Error(json.error || json.message || `Erro ${res.status}`);
  }
  
  return json;
}

async function login() {
  try {
    console.log('\n🔐 Fazendo login...');
    const res = await fazerRequisicao('POST', `${API_URL}/auth/login`, {
      email: 'admin@tech-refresh.com',
      senha: 'admin123'
    });
    token = res.token;
    console.log('✓ Login realizado');
    return res.usuario;
  } catch (err) {
    console.error('❌ Erro ao fazer login:', err.message);
    process.exit(1);
  }
}

async function buscarEquipamento(serie) {
  try {
    console.log(`\n🔍 Buscando equipamento ${serie}...`);
    const res = await fazerRequisicao('GET', `${API_URL}/equipamentos`);
    const eq = res.find(e => e.serialNumber === serie);
    if (eq) {
      equipamentoId = eq.id;
      console.log(`✓ Equipamento encontrado: ID ${eq.id}, Status: ${eq.statusProcesso}`);
      return eq;
    } else {
      console.error(`❌ Equipamento ${serie} não encontrado`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Erro ao buscar equipamento:', err.message);
    process.exit(1);
  }
}

async function buscarColaborador() {
  try {
    console.log('\n👤 Buscando um colaborador...');
    const res = await fazerRequisicao('GET', `${API_URL}/usuarios`);
    const colaboradores = res.filter(u => u.role === 'COLABORADOR' || u.role === 'TECNICO');
    if (colaboradores.length > 0) {
      colaboradorId = colaboradores[0].id;
      console.log(`✓ Colaborador encontrado: ID ${colaboradorId}, Nome: ${colaboradores[0].nome}`);
      return colaboradores[0];
    } else {
      console.error('❌ Nenhum colaborador encontrado');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Erro ao buscar colaborador:', err.message);
    process.exit(1);
  }
}

async function marcarComoEntregue() {
  try {
    console.log('\n📦 Marcando como "Entregue ao Usuário"...');
    const res = await fazerRequisicao('PUT', `${API_URL}/equipamentos/${equipamentoId}`, {
      statusProcesso: 'Entregue ao Usuário',
      agendamento: {
        colaboradorId: colaboradorId,
        data: new Date().toISOString().split('T')[0]
      }
    });
    console.log('✓ Equipamento marcado como entregue');
    return res;
  } catch (err) {
    console.error('❌ Erro ao marcar como entregue:', err.message);
    process.exit(1);
  }
}

async function verificarVinculacao(esperado) {
  try {
    console.log('\n🔗 Verificando vinculação...');
    const res = await fazerRequisicao('GET', `${API_URL}/vinculacoes?equipamentoId=${equipamentoId}`);
    const ativa = res.find(v => v.ativa === true);
    if (esperado && ativa) {
      console.log(`✓ Vinculação ATIVA encontrada: Usuário ${ativa.usuarioId}, Status: ${ativa.statusEntrega}`);
      return true;
    } else if (!esperado && !ativa) {
      console.log('✓ Nenhuma vinculação ativa (como esperado)');
      return true;
    } else if (esperado && !ativa) {
      console.error('❌ Vinculação deveria estar ATIVA mas está inativa');
      return false;
    } else {
      console.error('❌ Vinculação deveria estar INATIVA mas está ativa');
      return false;
    }
  } catch (err) {
    console.error('❌ Erro ao verificar vinculação:', err.message);
    return false;
  }
}

async function avancarStatus() {
  try {
    console.log('\n⏭️ Avançando para "Softwares Instalados"...');
    const res = await fazerRequisicao('PUT', `${API_URL}/equipamentos/${equipamentoId}`, {
      statusProcesso: 'Softwares Instalados'
    });
    console.log('✓ Status avançado');
    return res;
  } catch (err) {
    console.error('❌ Erro ao avançar status:', err.message);
    process.exit(1);
  }
}

async function voltarStatus() {
  try {
    console.log('\n⏮️ Voltando para "Preparação"...');
    const res = await fazerRequisicao('PUT', `${API_URL}/equipamentos/${equipamentoId}`, {
      statusProcesso: 'Preparação'
    });
    console.log('✓ Status voltado');
    return res;
  } catch (err) {
    console.error('❌ Erro ao voltar status:', err.message);
    process.exit(1);
  }
}

async function executarTeste() {
  console.log('='.repeat(60));
  console.log('TESTE DE VINCULAÇÃO AUTOMÁTICA');
  console.log('='.repeat(60));

  await login();
  await buscarEquipamento('F95C9H4');
  await buscarColaborador();
  await marcarComoEntregue();

  console.log('\n' + '='.repeat(60));
  console.log('TESTE 1: Vinculação deve estar ATIVA');
  console.log('='.repeat(60));
  const teste1 = await verificarVinculacao(true);

  await avancarStatus();

  console.log('\n' + '='.repeat(60));
  console.log('TESTE 2: Vinculação deve estar INATIVA (após avançar)');
  console.log('='.repeat(60));
  const teste2 = await verificarVinculacao(false);

  await voltarStatus();

  console.log('\n' + '='.repeat(60));
  console.log('TESTE 3: Vinculação deve estar INATIVA (após voltar)');
  console.log('='.repeat(60));
  const teste3 = await verificarVinculacao(false);

  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO FINAL');
  console.log('='.repeat(60));
  console.log(`Teste 1 (Criar vinculação): ${teste1 ? '✓ PASSOU' : '❌ FALHOU'}`);
  console.log(`Teste 2 (Desativar ao avançar): ${teste2 ? '✓ PASSOU' : '❌ FALHOU'}`);
  console.log(`Teste 3 (Desativar ao voltar): ${teste3 ? '✓ PASSOU' : '❌ FALHOU'}`);
  console.log('='.repeat(60));

  if (teste1 && teste2 && teste3) {
    console.log('\n✓ TODOS OS TESTES PASSARAM!');
    process.exit(0);
  } else {
    console.log('\n❌ ALGUNS TESTES FALHARAM');
    process.exit(1);
  }
}

executarTeste().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
