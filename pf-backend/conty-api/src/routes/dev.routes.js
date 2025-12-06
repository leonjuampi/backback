const express = require('express');
const { sendSetPasswordEmail } = require('../mailer');
const router = express.Router();

router.post('/dev/test-email', async (req, res) => {
  const { to } = req.body || {};
  if (!to) return res.status(400).json({ error: 'to required' });
  const link = `${process.env.BACKEND_URL}/api/auth/set-password?token=demo123`;
  try {
    await sendSetPasswordEmail(to, link, 'Demo');
    return res.json({ ok: true });
  } catch (e) {
    console.error('[MAIL] Send error:', e.message);
    return res.status(500).json({ error: 'send_failed' });
  }
});

module.exports = router;
