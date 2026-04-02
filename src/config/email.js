const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const enviarEmail = async ({ para, assunto, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[EMAIL] SMTP não configurado, e-mail não enviado.');
    return;
  }
  await transporter.sendMail({
    from: `"NTT Device Control" <${process.env.SMTP_USER}>`,
    to: para,
    subject: assunto,
    html,
  });
};

const templateAgendamento = ({ colaborador, equipamento, data, local, tecnico }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:32px 24px;border-radius:12px;">
  <div style="background:#1e40af;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">📦 Entrega de Equipamento Agendada</h2>
  </div>
  <p style="color:#334155;font-size:15px;">Olá, <strong>${colaborador}</strong>!</p>
  <p style="color:#475569;font-size:14px;">Sua entrega de equipamento foi agendada. Confira os detalhes:</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Equipamento</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${equipamento}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Data e Hora</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${data}</td></tr>
      ${local ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Local</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${local}</td></tr>` : ''}
      ${tecnico ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Técnico</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${tecnico}</td></tr>` : ''}
    </table>
  </div>
  <p style="color:#475569;font-size:13px;">Por favor, compareça no horário agendado com seu documento de identificação.</p>
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">NTT Device Control · Mensagem automática</p>
</div>`;

const templateReagendamento = ({ colaborador, equipamento, novaData, motivo, tecnico }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:32px 24px;border-radius:12px;">
  <div style="background:#d97706;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">🔄 Entrega Reagendada</h2>
  </div>
  <p style="color:#334155;font-size:15px;">Olá, <strong>${colaborador}</strong>!</p>
  <p style="color:#475569;font-size:14px;">Sua entrega foi reagendada para uma nova data:</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Equipamento</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${equipamento}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Nova Data</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${novaData}</td></tr>
      ${motivo ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Motivo</td><td style="padding:8px 0;color:#1e293b;font-size:13px;">${motivo}</td></tr>` : ''}
      ${tecnico ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Técnico</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${tecnico}</td></tr>` : ''}
    </table>
  </div>
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">NTT Device Control · Mensagem automática</p>
</div>`;

module.exports = { enviarEmail, templateAgendamento, templateReagendamento };
