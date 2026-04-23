const prisma = require('../config/prisma');

/**
 * Controlador do Assistente IA
 * Fornece respostas inteligentes baseadas em dados reais do sistema
 */

const obterDadosInteligentes = async (empresaId, projetoId, pergunta) => {
  try {
    const perguntaLower = pergunta.toLowerCase();

    // 1. SUGESTÕES INTELIGENTES - Equipamentos prontos para entregar
    if (perguntaLower.includes('pronto') || perguntaLower.includes('entregar') || perguntaLower.includes('agendad')) {
      const equipamentosProntos = await prisma.equipamento.count({
        where: {
          empresaId,
          ...(projetoId && { projetoId }),
          status: 'DISPONIVEL',
          statusProcesso: 'Softwares Instalados'
        }
      });

      if (equipamentosProntos > 0) {
        return {
          tipo: 'sugestao',
          conteudo: `🎯 Sugestão Inteligente:\n\nVocê tem ${equipamentosProntos} equipamento${equipamentosProntos > 1 ? 's' : ''} pronto${equipamentosProntos > 1 ? 's' : ''} para entregar!\n\n✅ Próxima ação:\n1. Vá para "Solicitações"\n2. Selecione os equipamentos\n3. Clique em "Agendar Entrega"\n4. Confirme\n\nIsso vai acelerar o processo! 🚀`
        };
      }
    }

    // 2. ALERTAS - Equipamentos atrasados
    if (perguntaLower.includes('atrasad') || perguntaLower.includes('problema') || perguntaLower.includes('alerta')) {
      const tresDiasAtras = new Date();
      tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

      const equipamentosAtrasados = await prisma.equipamento.count({
        where: {
          empresaId,
          ...(projetoId && { projetoId }),
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Novo', 'Imagem Instalada', 'Softwares Instalados', 'Asset Registrado'] },
          updatedAt: { lt: tresDiasAtras }
        }
      });

      if (equipamentosAtrasados > 0) {
        return {
          tipo: 'alerta',
          conteudo: `⚠️ ALERTA IMPORTANTE:\n\nVocê tem ${equipamentosAtrasados} equipamento${equipamentosAtrasados > 1 ? 's' : ''} atrasado${equipamentosAtrasados > 1 ? 's' : ''} (mais de 3 dias sem atualização)!\n\n🔴 Ação necessária:\n1. Vá para "Equipamentos"\n2. Filtre por "Atrasados"\n3. Atualize o status\n4. Agende entrega\n\nIsso é importante! ⏰`
        };
      }
    }

    // 3. STATUS EM TEMPO REAL - Dashboard
    if (perguntaLower.includes('status') || perguntaLower.includes('dashboard') || perguntaLower.includes('números') || perguntaLower.includes('total')) {
      const [total, emPreparacao, agendados, entregues, disponiveis] = await Promise.all([
        prisma.equipamento.count({
          where: { empresaId, ...(projetoId && { projetoId }), status: { not: 'DESCARTADO' } }
        }),
        prisma.equipamento.count({
          where: {
            empresaId,
            ...(projetoId && { projetoId }),
            status: { not: 'DESCARTADO' },
            statusProcesso: { in: ['Imagem Instalada', 'Softwares Instalados'] }
          }
        }),
        prisma.equipamento.count({
          where: {
            empresaId,
            ...(projetoId && { projetoId }),
            status: { not: 'DESCARTADO' },
            statusProcesso: 'Agendado para Entrega'
          }
        }),
        prisma.equipamento.count({
          where: {
            empresaId,
            ...(projetoId && { projetoId }),
            status: { not: 'DESCARTADO' },
            statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
          }
        }),
        prisma.equipamento.count({
          where: {
            empresaId,
            ...(projetoId && { projetoId }),
            status: 'DISPONIVEL',
            statusProcesso: { not: 'Agendado para Entrega' }
          }
        })
      ]);

      const percentualEntregue = total > 0 ? Math.round((entregues / total) * 100) : 0;

      return {
        tipo: 'status',
        conteudo: `📊 STATUS EM TEMPO REAL:\n\n📦 TOTAL: ${total} equipamentos\n\n🔄 EM PREPARAÇÃO: ${emPreparacao}\n📅 AGENDADOS: ${agendados}\n✅ ENTREGUES: ${entregues} (${percentualEntregue}%)\n📍 DISPONÍVEIS: ${disponiveis}\n\n${percentualEntregue >= 80 ? '🎉 Excelente progresso!' : percentualEntregue >= 50 ? '👍 Bom andamento!' : '⏳ Continue trabalhando!'}`
      };
    }

    // 4. RECOMENDAÇÕES - Próxima ação
    if (perguntaLower.includes('próxim') || perguntaLower.includes('recomend') || perguntaLower.includes('fazer')) {
      const equipamentosParaAgendar = await prisma.equipamento.count({
        where: {
          empresaId,
          ...(projetoId && { projetoId }),
          status: 'DISPONIVEL',
          statusProcesso: 'Softwares Instalados'
        }
      });

      const equipamentosParaPreparar = await prisma.equipamento.count({
        where: {
          empresaId,
          ...(projetoId && { projetoId }),
          status: { not: 'DESCARTADO' },
          statusProcesso: 'Novo'
        }
      });

      let recomendacao = '💡 RECOMENDAÇÕES:\n\n';

      if (equipamentosParaAgendar > 0) {
        recomendacao += `1️⃣ PRIORIDADE: Agendar ${equipamentosParaAgendar} equipamento${equipamentosParaAgendar > 1 ? 's' : ''} pronto${equipamentosParaAgendar > 1 ? 's' : ''}\n`;
      }

      if (equipamentosParaPreparar > 0) {
        recomendacao += `2️⃣ Preparar ${equipamentosParaPreparar} equipamento${equipamentosParaPreparar > 1 ? 's' : ''} novo${equipamentosParaPreparar > 1 ? 's' : ''}\n`;
      }

      if (equipamentosParaAgendar === 0 && equipamentosParaPreparar === 0) {
        recomendacao += '✅ Tudo em dia! Nenhuma ação urgente.';
      }

      return {
        tipo: 'recomendacao',
        conteudo: recomendacao
      };
    }

    return null;
  } catch (err) {
    console.error('[IA] Erro ao obter dados inteligentes:', err);
    return null;
  }
};

const chat = async (req, res) => {
  try {
    const { mensagem } = req.body;
    const empresaId = req.usuario.empresaId;
    const projetoId = req.usuario.projetoId || null;

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    // Tentar obter dados inteligentes
    const dadosInteligentes = await obterDadosInteligentes(empresaId, projetoId, mensagem);

    if (dadosInteligentes) {
      return res.json({
        tipo: dadosInteligentes.tipo,
        resposta: dadosInteligentes.conteudo,
        timestamp: new Date()
      });
    }

    // Se não encontrou dados inteligentes, retorna resposta padrão
    res.json({
      tipo: 'padrao',
      resposta: '😊 Entendi sua pergunta!\n\nPosso ajudar com:\n• 📱 Equipamentos\n• 📅 Agendamentos\n• 📊 Dashboard\n• 👥 Usuários\n• 📝 Solicitações\n\nTente perguntar algo mais específico!',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[IA] Erro no chat:', err);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
};

module.exports = { chat, obterDadosInteligentes };
