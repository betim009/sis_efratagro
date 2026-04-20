/**
 * Provider de e-mail — base preparada para envio futuro.
 *
 * Decisão: o módulo de notificações deve funcionar 100% sem e-mail.
 * Este provider define a interface e o ponto de extensão para quando
 * o SMTP/Sendgrid/SES for configurado. Hoje ele apenas loga a intenção.
 *
 * Para ativar o envio real:
 * 1. Instale o pacote (ex: nodemailer)
 * 2. Configure as variáveis de ambiente (SMTP_HOST, SMTP_PORT, etc.)
 * 3. Implemente a função `enviar()` abaixo
 * 4. Mude `isAtivo()` para retornar true quando as variáveis estiverem configuradas
 *
 * Nenhum código de negócio precisará mudar — o notificacaoHelper.js
 * já chama `emailProvider.enviarSeAtivo()` de forma fire-and-forget.
 */

// ─── Verifica se o provider de e-mail está ativo ────────────────────

const isAtivo = () => {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER
  );
};

// ─── Envio real de e-mail (stub) ────────────────────────────────────

const enviar = async ({ para, assunto, corpo }) => {
  // TODO: implementar com nodemailer ou outro provider
  // Exemplo com nodemailer:
  //
  // const transporter = nodemailer.createTransport({
  //   host: env.SMTP_HOST,
  //   port: env.SMTP_PORT,
  //   auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  // });
  //
  // await transporter.sendMail({
  //   from: env.SMTP_FROM || "noreply@efratagro.com",
  //   to: para,
  //   subject: assunto,
  //   html: corpo
  // });

  console.log(
    `[email-provider] Envio de email desabilitado. Destinatário: ${para}, Assunto: ${assunto}`
  );
};

// ─── Interface pública usada pelo notificacaoHelper ─────────────────

const enviarSeAtivo = async ({ usuarioId, tipo, titulo, mensagem, prioridade }) => {
  if (!isAtivo()) {
    return;
  }

  // Aqui futuramente: buscar e-mail do usuário no banco
  // const usuario = await usuarioModel.findById(usuarioId);
  // if (!usuario || !usuario.email) return;

  const assunto = `[ERP Efrat Agro] ${titulo}`;
  const corpo = `
    <h3>${titulo}</h3>
    <p>${mensagem}</p>
    <p><strong>Tipo:</strong> ${tipo} | <strong>Prioridade:</strong> ${prioridade}</p>
  `;

  await enviar({ para: "destinatario@placeholder.com", assunto, corpo });
};

module.exports = {
  isAtivo,
  enviar,
  enviarSeAtivo
};
