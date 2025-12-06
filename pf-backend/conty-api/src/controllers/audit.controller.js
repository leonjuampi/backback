// src/controllers/audit.controller.js
const svc = require('../services/audit.service');

async function listLogs(req, res) {
  try {
    const roleId = req.user.roleId;

    // Determinar orgId a filtrar
    // Si es Owner (2), forzamos su orgId.
    // Si es Admin (1), usamos el del query param (opcional) o null (todos).
    const orgId = roleId === 2 ? req.user.orgId : (req.query.orgId ? Number(req.query.orgId) : undefined);

    const filters = {
      orgId,
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      actionType: req.query.actionType,
      entityType: req.query.entityType,
      entityId: req.query.entityId ? Number(req.query.entityId) : undefined,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
      offset: req.query.offset
    };

    const result = await svc.listAuditLogs(filters);

    res.json({
        items: result.items,
        total: result.total,
        page: Math.floor((Number(req.query.offset || 0) / Number(req.query.limit || 50)) + 1),
        pageSize: Number(req.query.limit || 50)
    });

  } catch (e) {
    console.error('[AUDIT_CONTROLLER] list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { listLogs };
