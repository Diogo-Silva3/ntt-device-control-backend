const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Tech Refresh <noreply@tech-refresh.cloud>';
const LOGO_URL = 'https://tech-refresh.cloud/Logo.png';

const enviarEmail = async ({ para, assunto, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY não configurado.');
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to: para, subject: assunto, html });
  if (error) throw new Error(error.message);
};

const cabecalho = () => `
  <div style="text-align:center;padding:24px 0 16px;">
    <img src="${LOGO_URL}" alt="Tech Refresh" style="height:52px;object-fit:contain;" />
  </div>`;

const rodape = () => `
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;">
    Tech Refresh · Mensagem automática
  </p>`;

const templateAgendamento = ({ colaborador, equipamento, data, tecnico }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
  ${cabecalho()}
  <div style="background:#1e40af;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">Entrega de Equipamento Agendada</h2>
  </div>
  <p style="color:#334155;">Olá, <strong>${colaborador}</strong>!</p>
  <p style="color:#475569;font-size:14px;">Sua entrega foi agendada. Confira os detalhes:</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Equipamento</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${equipamento}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Data e Hora</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${data}</td></tr>
      ${tecnico ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Técnico</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${tecnico}</td></tr>` : ''}
    </table>
  </div>
  <p style="color:#475569;font-size:13px;">Por favor, compareça no horário agendado com seu documento de identificação.</p>
  ${rodape()}
</div>`;

const templateReagendamento = ({ colaborador, equipamento, novaData, motivo, tecnico }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
  ${cabecalho()}
  <div style="background:#d97706;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">Entrega Reagendada</h2>
  </div>
  <p style="color:#334155;">Olá, <strong>${colaborador}</strong>!</p>
  <p style="color:#475569;font-size:14px;">Sua entrega foi reagendada para uma nova data:</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Equipamento</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${equipamento}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Nova Data</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${novaData}</td></tr>
      ${motivo ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Motivo</td><td style="padding:8px 0;color:#1e293b;font-size:13px;">${motivo}</td></tr>` : ''}
      ${tecnico ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Técnico</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${tecnico}</td></tr>` : ''}
    </table>
  </div>
  ${rodape()}
</div>`;

const templateEntregue = ({ colaborador, equipamento, tecnico }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
  ${cabecalho()}
  <div style="background:#059669;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">Equipamento Entregue com Sucesso</h2>
  </div>
  <p style="color:#334155;">Olá, <strong>${colaborador}</strong>!</p>
  <p style="color:#475569;font-size:14px;">Seu equipamento foi entregue e registrado no sistema.</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Equipamento</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${equipamento}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Data</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
      ${tecnico ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Técnico</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${tecnico}</td></tr>` : ''}
    </table>
  </div>
  <p style="color:#475569;font-size:13px;">Em caso de dúvidas, entre em contato com a equipe de TI.</p>
  ${rodape()}
</div>`;

const templateLembrete = ({ colaborador, equipamento, data, tecnico }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
  ${cabecalho()}
  <div style="background:#7c3aed;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">Lembrete: Entrega Amanhã</h2>
  </div>
  <p style="color:#334155;">Olá, <strong>${colaborador}</strong>!</p>
  <p style="color:#475569;font-size:14px;">Lembramos que sua entrega de equipamento está agendada para <strong>amanhã</strong>.</p>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:40%;">Equipamento</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${equipamento}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Data e Hora</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${data}</td></tr>
      ${tecnico ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Técnico</td><td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${tecnico}</td></tr>` : ''}
    </table>
  </div>
  <p style="color:#475569;font-size:13px;">Por favor, compareça no horário agendado com seu documento de identificação.</p>
  ${rodape()}
</div>`;

module.exports = { enviarEmail, templateAgendamento, templateReagendamento, templateEntregue, templateLembrete };
