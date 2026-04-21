const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testar() {
  try {
    console.log('=== Testando validação de agendamento ===\n');
    
    // Simular um equipamento em "Asset Registrado"
    const equipamentoId = 576; // H45C9H4
    
    console.log('Teste 1: Tentar agendar SEM colaborador');
    try {
      await axios.put(`${API_URL}/equipamentos/${equipamentoId}`, {
        statusProcesso: 'Agendado para Entrega',
        agendamento: {
          data: '2026-04-21',
          horario: '10:00',
          local: 'Sala TI'
          // Falta colaboradorId
        }
      }, {
        headers: {
          'Authorization': 'Bearer token-teste',
          'x-projeto-id': '1'
        }
      });
      console.log('❌ FALHOU: Deveria ter rejeitado sem colaborador');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✓ PASSOU: Rejeitou corretamente');
        console.log(`  Erro: ${err.response.data.error}\n`);
      } else {
        console.log(`❌ Erro inesperado: ${err.message}\n`);
      }
    }
    
    console.log('Teste 2: Tentar agendar SEM data');
    try {
      await axios.put(`${API_URL}/equipamentos/${equipamentoId}`, {
        statusProcesso: 'Agendado para Entrega',
        agendamento: {
          colaboradorId: '82',
          horario: '10:00',
          local: 'Sala TI'
          // Falta data
        }
      }, {
        headers: {
          'Authorization': 'Bearer token-teste',
          'x-projeto-id': '1'
        }
      });
      console.log('❌ FALHOU: Deveria ter rejeitado sem data');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✓ PASSOU: Rejeitou corretamente');
        console.log(`  Erro: ${err.response.data.error}\n`);
      } else {
        console.log(`❌ Erro inesperado: ${err.message}\n`);
      }
    }
    
    console.log('Teste 3: Agendar COM colaborador E data (deve funcionar)');
    try {
      const res = await axios.put(`${API_URL}/equipamentos/${equipamentoId}`, {
        statusProcesso: 'Agendado para Entrega',
        agendamento: {
          colaboradorId: '82',
          data: '2026-04-21',
          horario: '10:00',
          local: 'Sala TI'
        }
      }, {
        headers: {
          'Authorization': 'Bearer token-teste',
          'x-projeto-id': '1'
        }
      });
      console.log('✓ PASSOU: Agendamento aceito');
      console.log(`  StatusProcesso: ${res.data.statusProcesso}\n`);
    } catch (err) {
      console.log(`❌ FALHOU: ${err.response?.data?.error || err.message}\n`);
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

testar();
