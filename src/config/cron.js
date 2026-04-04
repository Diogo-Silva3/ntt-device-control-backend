const prisma = require('./prisma');
const { enviarEmail, templateLembrete } = require('./email');

// Roda a cada hora verificando entregas agendadas para amanhã
const iniciarCron = () => {
  const INTERVALO = 60 * 60 * 1000; // 1 hora

  const verificarLembretes = async () => {
    try {
      const agora = new Date();
      const amanha = new Date(agora);
      amanha.setDate(amanha.getDate() + 1);

      // Janela: amanhã entre 00:00 e 23:59
      const inicio = new Date(amanha);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(amanha);
      fim.setHours(23, 59, 59, 999);

      const vinculacoes = await prisma.vinculacao.findMany({
        where: {
          ativa: true,
          statusEntrega: 'PENDENTE',
          dataAgendamento: { gte: inicio, lte: fim },
          lembreteEnviado: false,
        },
        include: {
          usuario: { select: { id: true, nome: true, email: true } },
          equipamento: { select: { marca: true, modelo: true } },
          tecnico: { select: { nome: true } },
        },
      });

      for (const v of vinculacoes) {
        if (!v.usuario?.email) continue;

        const dataFormatada = new Date(v.dataAgendamento).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
          year: 'numeric', hour: '2-digit', minute: '2-digit',
        });

        try {
          await enviarEmail({
            para: v.usuario.email,
            assunto: 'Tech Refresh - Lembrete: entrega amanhã',
            html: templateLembrete({
              colaborador: v.usuario.nome,
              equipamento: `${v.equipamento?.marca || ''} ${v.equipamento?.modelo || ''}`.trim() || 'Equipamento',
              data: dataFormatada,
              tecnico: v.tecnico?.nome,
            }),
          });

          await prisma.vinculacao.update({
            where: { id: v.id },
            data: { lembreteEnviado: true },
          });

          console.log(`[CRON] Lembrete enviado para ${v.usuario.email}`);
        } catch (err) {
          console.error(`[CRON] Erro ao enviar lembrete para ${v.usuario.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[CRON] Erro ao verificar lembretes:', err.message);
    }
  };

  // Roda imediatamente e depois a cada hora
  verificarLembretes();
  setInterval(verificarLembretes, INTERVALO);
  console.log('[CRON] Serviço de lembretes iniciado');
};

module.exports = { iniciarCron };
