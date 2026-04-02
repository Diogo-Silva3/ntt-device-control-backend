const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Tech Refresh <noreply@tech-refresh.cloud>';

const enviarEmail = async ({ para, assunto, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY não configurado.');
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to: para, subject: assunto, html });
  if (error) throw new Error(error.message);
};

const templateAgendamento = ({ colaborador, equipamento, data, tecnico }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:32px 24px;border-radius:12px;">
  <div style="background:#1e40af;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">Entrega de Equipamento Agendada</h2>
  </div>
  <p style="color:#334155;">Ola, <strong>${colaborador}</strong>!</p>
  <p style="color:#475569;font-size:14px;">Sua entrega foi agendada. Confira os detalhes:</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Equipamento</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${equipamento}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Data e Hora</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${data}</td></tr>
      ${tecnico ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Tecnico</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${tecnico}</td></tr>` : ''}
    </table>
  </div>
  <p style="color:#475569;font-size:13px;">Por favor, compareça no horario agendado com seu documento de identificacao.</p>
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">NTT Device Control · Mensagem automatica</p>
</div>`;

const templateReagendamento = ({ colaborador, equipamento, novaData, motivo, tecnico }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:32px 24px;border-radius:12px;">
  <div style="background:#d97706;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">Entrega Reagendada</h2>
  </div>
  <p style="color:#334155;">Ola, <strong>${colaborador}</strong>!</p>
  <p style="color:#475569;font-size:14px;">Sua entrega foi reagendada para uma nova data:</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Equipamento</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${equipamento}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Nova Data</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${novaData}</td></tr>
      ${motivo ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Motivo</td><td style="padding:8px 0;color:#1e293b;font-size:13px;">${motivo}</td></tr>` : ''}
      ${tecnico ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Tecnico</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${tecnico}</td></tr>` : ''}
    </table>
  </div>
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">NTT Device Control · Mensagem automatica</p>
</div>`;

module.exports = { enviarEmail, templateAgendamento, templateReagendamento };
