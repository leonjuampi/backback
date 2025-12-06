// src/controllers/numbering.controller.js
const svc = require('../services/numbering.service');

async function listRules(req, res) {
  try {
    // Rol 2 (Owner) solo ve su propia org
    // Rol 1 (Admin) puede ver otras si se especifica, o la suya propia si tiene (aunque admin suele tener orgId null)
    const orgId = req.user.roleId === 2 ? req.user.orgId : Number(req.query.orgId || req.user.orgId);
    const items = await svc.listRules(orgId);
    res.json({ items });
  } catch (e) {
    console.error('[NUM] list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function preview(req, res) {
  try {
    const { docType, posCode } = req.query;
    if (!docType || !posCode) return res.status(400).json({ message: 'docType and posCode are required' });

    const orgId = req.user.roleId === 2 ? req.user.orgId : Number(req.query.orgId || req.user.orgId);

    const out = await svc.previewNext(orgId, String(docType), String(posCode));
    res.json(out);
  } catch (e) {
    if (e.message === 'RULE_NOT_FOUND') return res.status(404).json({ message: 'Rule not found' });
    console.error('[NUM] preview error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function upsert(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría

    if (req.user.roleId !== 2) return res.status(403).json({ message: 'Forbidden' });

    const { docType, format, nextNumber, padding, resetPolicy } = req.body || {};
    if (!docType || !format || !padding) return res.status(400).json({ message: 'Missing fields' });

    // Pasar userId al servicio
    await svc.upsertRule({
      orgId,
      docType,
      format,
      nextNumber: nextNumber ?? 1,
      padding,
      resetPolicy: resetPolicy || 'NEVER',
      userId // <--
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[NUM] upsert error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function remove(req, res) {
  try {
    if (req.user.roleId !== 2) return res.status(403).json({ message: 'Forbidden' });

    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const { docType } = req.params;

    // Pasar userId al servicio
    await svc.deleteRule(orgId, docType, userId);

    res.status(204).send();
  } catch (e) {
    console.error('[NUM] delete error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { listRules, preview, upsert, remove };
