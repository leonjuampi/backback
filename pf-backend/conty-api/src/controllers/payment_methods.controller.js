// src/controllers/payment_methods.controller.js
const svc = require('../services/payment_methods.service');

async function list(req, res) {
  try {
    const roleId = req.user.roleId;

    // Misma lógica corregida
    const orgId = (roleId === 1) 
      ? (req.query.orgId ? Number(req.query.orgId) : undefined) 
      : req.user.orgId;

    if (!orgId && roleId !== 1) return res.status(400).json({ message: 'orgId required for this user role' });

    // Validación extra de seguridad que tenías, adaptada:
    // Si no es Admin, el ID solicitado debe coincidir con el del token (redundante con la lógica de arriba, pero seguro)
    if (roleId !== 1 && orgId !== req.user.orgId) {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const items = await svc.listPaymentMethods(orgId);
    res.json({ items });
  } catch (e) {
    console.error('[PM] List error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function create(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const { name, kind, max_installments, surcharge_pct, discount_pct, ticket_note, active } = req.body;

    if (!name || !kind) {
      return res.status(400).json({ message: 'name and kind are required' });
    }

    const validKinds = ['CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'MIXED'];
    if (!validKinds.includes(kind)) {
       return res.status(400).json({ message: `Invalid kind: ${kind}` });
    }

    // Pasar userId al servicio
    const id = await svc.createPaymentMethod({
      orgId,
      name,
      kind,
      max_installments: max_installments ?? 1,
      surcharge_pct: surcharge_pct ?? 0,
      discount_pct: discount_pct ?? 0,
      ticket_note: ticket_note || null,
      active: active !== undefined ? !!active : true,
      createdBy: userId
    });

    res.status(201).json({ id });
  } catch (e) {
     if (e.code === 'ER_DUP_ENTRY') {
       return res.status(409).json({ message: 'Payment method name already exists for this organization' });
     }
    console.error('[PM] Create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function update(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const id = Number(req.params.id);
    const payload = req.body;

    if (payload.kind) {
       const validKinds = ['CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'MIXED'];
       if (!validKinds.includes(payload.kind)) {
          return res.status(400).json({ message: `Invalid kind: ${payload.kind}` });
       }
    }

    // Pasar userId al servicio
    const affectedRows = await svc.updatePaymentMethod(id, orgId, payload, userId);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Payment method not found or does not belong to this organization' });
    }
    res.json({ message: 'Updated' });
  } catch (e) {
     if (e.code === 'ER_DUP_ENTRY') {
       return res.status(409).json({ message: 'Payment method name already exists for this organization' });
     }
    console.error('[PM] Update error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function remove(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const id = Number(req.params.id);

    // Pasar userId al servicio
    const affectedRows = await svc.deletePaymentMethod(id, orgId, userId);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Payment method not found or does not belong to this organization' });
    }
    res.status(204).send();
  } catch (e) {
    console.error('[PM] Delete error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { list, create, update, remove };
