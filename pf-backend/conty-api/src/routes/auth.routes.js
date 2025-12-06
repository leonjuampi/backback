const express = require('express');
const { login } = require('../controllers/auth.controller');
const {
  getUserBySetToken,
  completePasswordSetup,
  issueResetToken,
  getUserByResetToken,
  completePasswordReset
} = require('../services/user.service');
const { sendForgotPasswordEmail } = require('../mailer');
const { requireAuth } = require('../middlewares/auth.middleware');
const { refresh, switchContext } = require('../controllers/auth.extra.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication & account flows
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required: [username, password]
 *       properties:
 *         username: { type: string, example: admin }
 *         password: { type: string, example: Admin123! }
 *     TokenResponse:
 *       type: object
 *       properties:
 *         token: { type: string }
 *         user:
 *           type: object
 *           properties:
 *             uid: { type: integer }
 *             roleId: { type: integer }
 *             username: { type: string }
 *             email: { type: string, format: email }
 *             orgId: { type: integer, nullable: true }
 *             branchId: { type: integer, nullable: true }
 *             branchIds:
 *               type: array
 *               items: { type: integer }
 *     SwitchContextRequest:
 *       type: object
 *       required: [branchId]
 *       properties:
 *         branchId: { type: integer }
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: JWT issued
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TokenResponse' }
 *       400: { description: Invalid credentials or user not found }
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/check-token:
 *   get:
 *     summary: Valida token de invitación antes del seteo de contraseña
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       200: { description: Token válido }
 *       400: { description: Falta token }
 *       404: { description: Token inválido }
 *       410: { description: Token expirado }
 */
router.get('/check-token', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ valid: false, error: 'TOKEN_REQUIRED' });

  const user = await getUserBySetToken(token);
  if (!user) return res.status(404).json({ valid: false, error: 'TOKEN_INVALID' });
  if (new Date(user.password_set_expires) < new Date()) {
    return res.status(410).json({ valid: false, error: 'TOKEN_EXPIRED' });
  }
  return res.json({ valid: true, email: user.email, username: user.username });
});

/**
 * @swagger
 * /api/auth/set-password:
 *   post:
 *     summary: Completa el seteo de contraseña usando token de invitación
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200: { description: Password seteada, usuario activado }
 *       400: { description: Datos inválidos }
 *       404: { description: Token inválido }
 *       410: { description: Token expirado }
 */
router.post('/set-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'TOKEN_AND_PASSWORD_REQUIRED' });
  if (String(password).length < 8) return res.status(400).json({ error: 'WEAK_PASSWORD' });

  try {
    const out = await completePasswordSetup(token, password);
    return res.json({ ok: true, userId: out.userId });
  } catch (e) {
    if (e.message === 'INVALID_TOKEN') return res.status(404).json({ error: 'TOKEN_INVALID' });
    if (e.message === 'TOKEN_EXPIRED') return res.status(410).json({ error: 'TOKEN_EXPIRED' });
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicita un correo de restablecimiento de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Siempre OK (no revela existencia del usuario) }
 *       400: { description: Falta email }
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'EMAIL_REQUIRED' });

  try {
    const out = await issueResetToken(email);
    if (out) {
      const frontendUrl = process.env.FRONTEND_URL
      const link = `${frontendUrl}/reset-password?token=${out.token}`;
     // const link = `${process.env.BACKEND_URL}/api/auth/reset-password?token=${out.token}`;
      try {
        await sendForgotPasswordEmail(email, link);
      } catch (e) {
        console.error('[MAIL][forgot] send error:', e.message);
      }
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('[FORGOT] error:', e.message);
    return res.json({ ok: true });
  }
});

/**
 * @swagger
 * /api/auth/check-reset-token:
 *   get:
 *     summary: Valida token de reset (opcional para front)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Token válido }
 *       400: { description: Falta token }
 *       404: { description: Token inválido }
 *       410: { description: Token expirado }
 */
router.get('/check-reset-token', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ valid: false, error: 'TOKEN_REQUIRED' });

  const user = await getUserByResetToken(token);
  if (!user) return res.status(404).json({ valid: false, error: 'TOKEN_INVALID' });
  if (new Date(user.reset_password_expires) < new Date()) {
    return res.status(410).json({ valid: false, error: 'TOKEN_EXPIRED' });
  }
  return res.json({ valid: true, email: user.email, username: user.username });
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Define nueva contraseña usando token de reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200: { description: Contraseña restablecida }
 *       400: { description: Datos inválidos }
 *       404: { description: Token inválido }
 *       410: { description: Token expirado }
 */
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'TOKEN_AND_PASSWORD_REQUIRED' });
  if (String(password).length < 8) return res.status(400).json({ error: 'WEAK_PASSWORD' });

  try {
    const out = await completePasswordReset(token, password);
    return res.json({ ok: true, userId: out.userId });
  } catch (e) {
    if (e.message === 'INVALID_TOKEN') return res.status(404).json({ error: 'TOKEN_INVALID' });
    if (e.message === 'TOKEN_EXPIRED') return res.status(410).json({ error: 'TOKEN_EXPIRED' });
    console.error('[RESET] error:', e.message);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh user token (rebuild context)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Token refrescado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TokenResponse' }
 */
router.post('/refresh', requireAuth, refresh);

/**
 * @swagger
 * /api/auth/switch-context:
 *   post:
 *     summary: Cambia la branch activa del usuario
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SwitchContextRequest' }
 *     responses:
 *       200:
 *         description: Token actualizado con branch activa
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TokenResponse' }
 */
router.post('/switch-context', requireAuth, switchContext);

// --- Páginas temporales para flujo sin frontend ---

router.get('/set-password', (req, res) => {
  const token = String(req.query.token || '');
  const html = `
<!doctype html>
<meta charset="utf-8"/>
<title>Crear contraseña • Conty</title>
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:420px;margin:40px auto;padding:24px;border:1px solid #eee;border-radius:12px">
  <h2>Crear tu contraseña</h2>
  <p>Definí una contraseña para activar tu cuenta.</p>
  <form id="f">
    <input type="hidden" name="token" value="\${token}">
    <label style="display:block;margin:12px 0 6px">Nueva contraseña</label>
    <input name="password" type="password" minlength="8" required
           style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px"/>
    <button style="margin-top:14px;padding:10px 16px;border:0;border-radius:8px;background:#007bff;color:#fff;font-weight:600">
      Crear contraseña
    </button>
  </form>
  <pre id="out" style="white-space:pre-wrap;margin-top:14px;color:#333"></pre>
</div>
<script>
  const f = document.getElementById('f');
  const out = document.getElementById('out');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f).entries());
    const r = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const j = await r.json().catch(()=>({}));
    out.textContent = r.ok ? '✅ Listo: contraseña creada. Ya podés ir a iniciar sesión.' : '❌ Error: ' + (j.error || j.message);
  });
</script>`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.status(200).send(html.replace('\${token}', token));
});

router.get('/reset-password', (req, res) => {
  const token = String(req.query.token || '');
  const html = `
<!doctype html>
<meta charset="utf-8"/>
<title>Restablecer contraseña • Conty</title>
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:420px;margin:40px auto;padding:24px;border:1px solid #eee;border-radius:12px">
  <h2>Restablecer contraseña</h2>
  <p>Ingresá una nueva contraseña para tu cuenta.</p>
  <form id="f">
    <input type="hidden" name="token" value="\${token}">
    <label style="display:block;margin:12px 0 6px">Nueva contraseña</label>
    <input name="password" type="password" minlength="8" required
           style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px"/>
    <button style="margin-top:14px;padding:10px 16px;border:0;border-radius:8px;background:#4CAF50;color:#fff;font-weight:600">
      Restablecer
    </button>
  </form>
  <pre id="out" style="white-space:pre-wrap;margin-top:14px;color:#333"></pre>
</div>
<script>
  const f = document.getElementById('f');
  const out = document.getElementById('out');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f).entries());
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const j = await r.json().catch(()=>({}));
    out.textContent = r.ok ? '✅ Listo: contraseña actualizada. Probá iniciar sesión.' : '❌ Error: ' + (j.error || j.message);
  });
</script>`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.status(200).send(html.replace('\${token}', token));
});

module.exports = router;
