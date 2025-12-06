const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE) === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transporter.verify((err) => {
  if (err) {
    console.error('[MAIL] Transport verify failed:', err.message);
  } else {
    console.log('[MAIL] Transport ready');
  }
});

async function sendSetPasswordEmail(to, link, name) {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7; padding: 30px;">
      <div style="max-width: 560px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="text-align:center;">
          <img src="https://i.imgur.com/F4Gq0uL.png" alt="Conty Logo" width="80" style="margin-bottom:15px;" />
          <h2 style="color:#111;">¡Te crearon un usuario en Conty!</h2>
        </div>
        <p style="color:#333; font-size:15px; line-height:1.5;">
          Hola ${name || ''}, tu cuenta ya fue creada. Solo falta que definas una contraseña para comenzar a usar Conty.
        </p>
        <div style="text-align:center; margin: 25px 0;">
          <a href="${link}"
             style="background-color:#007bff; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; display:inline-block; font-weight:bold;">
             ✨ Crear mi contraseña
          </a>
        </div>
        <p style="color:#666; font-size:13px;">
          Este enlace vence en <strong>${process.env.TOKEN_TTL_HOURS || 48} horas</strong>.
        </p>
        <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />
        <p style="color:#999; font-size:12px; text-align:center;">
          © ${new Date().getFullYear()} Conty — Gestión simple y segura.
        </p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: '✨ Bienvenido a Conty',
    html,
  });

  console.log('[MAIL][invite] Sent:', info.messageId);
}


async function sendForgotPasswordEmail(to, link) {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7; padding: 30px;">
      <div style="max-width: 560px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="text-align:center;">
          <img src="https://i.imgur.com/F4Gq0uL.png" alt="Conty Logo" width="80" style="margin-bottom:15px;" />
          <h2 style="color:#111;">¿Olvidaste tu contraseña?</h2>
        </div>
        <p style="color:#333; font-size:15px; line-height:1.5;">
          Recibimos una solicitud para restablecer tu contraseña de acceso a <strong>Conty</strong>.
        </p>
        <p style="color:#333; font-size:15px; line-height:1.5;">
          Para continuar, hacé clic en el botón de abajo. El enlace vence en <strong>${process.env.TOKEN_TTL_HOURS || 48} horas</strong>.
        </p>
        <div style="text-align:center; margin: 25px 0;">
          <a href="${link}"
             style="background-color:#4CAF50; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; display:inline-block; font-weight:bold;">
             🔒 Restablecer contraseña
          </a>
        </div>
        <p style="color:#666; font-size:13px;">
          Si no solicitaste este cambio, podés ignorar este correo: tu cuenta seguirá segura.
        </p>
        <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />
        <p style="color:#999; font-size:12px; text-align:center;">
          © ${new Date().getFullYear()} Conty — Gestión simple y segura.
        </p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: '🔑 Restablecer tu contraseña • Conty',
    html,
  });

  console.log('[MAIL][forgot] Sent:', info.messageId);
}


module.exports = { transporter, sendSetPasswordEmail, sendForgotPasswordEmail };
