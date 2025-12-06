// src/controllers/sales.controller.js
const svc = require('../services/sales.service');

// --- Función LIST (Faltaba o estaba mal exportada) ---
async function list(req, res) {
  try {
    const orgId = req.user.orgId;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const items = await svc.listSales({
      orgId,
      branchId,
      from: req.query.from,
      to: req.query.to,
      status: req.query.status,
      search: req.query.search,
      limit: Number(req.query.limit || 50),
      offset: Number(req.query.offset || 0)
    });
    res.json({ items });
  } catch (e) {
    console.error('[SALES] list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getOne(req, res) {
  try {
    const out = await svc.getSale(Number(req.params.id), req.user.orgId);
    if (!out) return res.status(404).json({ message: 'Not found' });
    res.json(out);
  } catch (e) {
    console.error('[SALES] get error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function create(req, res) {
  try {
    const orgId = req.user.orgId;
    // Obtenemos el userId del token para pasarlo como 'sellerId' si no viene,
    // y también para auditoría si el servicio lo requiere.
    // (En tu servicio actual usas sellerId para createdBy)
    const userId = req.user.uid;

    const { branchId, posCode, docType, customerId, sellerId, items, payments, note, refCode } = req.body || {};
    if (!branchId || !posCode || !docType || !items?.length) {
      return res.status(400).json({ message: 'branchId, posCode, docType, items required' });
    }
    const out = await svc.createSale({
      orgId,
      branchId: Number(branchId),
      posCode: String(posCode),
      docType: String(docType),
      customerId: customerId ? Number(customerId) : null,
      sellerId: sellerId ? Number(sellerId) : userId, // Usa userId si no hay sellerId
      items,
      payments,
      note,
      refCode
    });
    res.status(201).json(out);
  } catch (e) {
    if (e.message.startsWith('INSUFFICIENT_STOCK')) {
      console.warn('[SALES] Insufficient stock attempt:', e.message);
      return res.status(400).json({ message: e.message });
    }
    if (e.message === 'RULE_NOT_FOUND') {
      return res.status(400).json({ message: 'Numbering rule not found' });
    }
    if (e.message.includes('RULE_NOT_FOUND') || e.message.includes('Método de pago') || e.message.includes('FORBIDDEN_OR_NOT_FOUND')) {
       console.warn('[SALES] Business logic error:', e.message);
       return res.status(400).json({ message: e.message });
    }

    if (e.message.startsWith('FORBIDDEN_OR_NOT_FOUND') || e.message.startsWith('FORBIDDEN_CUSTOMER')) {
      console.warn('[SALES] Forbidden access attempt:', e.message);
      return res.status(403).json({ message: e.message });
    }
    if (e.message.startsWith('Payment method')) {
        console.warn('[SALES] Payment method error:', e.message);
        return res.status(400).json({ message: e.message });
    }

    console.error('[SALES] create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function cancel(req, res) {
  try {
    await svc.cancelSale({
      orgId: req.user.orgId,
      saleId: Number(req.params.id),
      userId: req.user.uid,
      reason: req.body?.reason || null
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ message: 'Not found' });
    if (e.message === 'ALREADY_CANCELLED') return res.status(409).json({ message: 'Already cancelled' });
    console.error('[SALES] cancel error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function addPayments(req, res) {
  try {
    const saleId = Number(req.params.id);
    const orgId = req.user.orgId;
    const userId = req.user.uid;
    const { payments } = req.body;

    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: 'El array de pagos es requerido y no puede estar vacío.' });
    }
    for (const p of payments) {
      if (!p.method || p.amount === undefined || p.amount === null || Number(p.amount) <= 0) {
        return res.status(400).json({ message: 'Cada pago debe incluir method (string) y amount (número positivo).' });
      }
    }

    const result = await svc.registerSalePayments({
      orgId,
      saleId,
      userId,
      payments,
    });

    res.status(201).json({ count: result.length, paymentIds: result });

  } catch (e) {
    if (e.message === 'SALE_NOT_FOUND' || e.message === 'FORBIDDEN_SALE') {
      return res.status(404).json({ message: 'Venta no encontrada o no pertenece a esta organización.' });
    }
    if (e.message === 'SALE_CANCELLED') {
       return res.status(409).json({ message: 'No se pueden añadir pagos a una venta cancelada.' });
    }
    if (e.message.startsWith('Payment method')) {
      return res.status(400).json({ message: e.message });
    }

    console.error('[SALES] addPayments error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

// --- IMPORTANTE: Exportar TODAS las funciones ---
module.exports = {
    list,
    getOne,
    create,
    cancel,
    addPayments
};
