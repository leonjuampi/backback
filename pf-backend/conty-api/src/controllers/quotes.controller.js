// src/controllers/quotes.controller.js
const svc = require('../services/quotes.service');

async function list(req, res) {
  try {
    const items = await svc.listQuotes({
      orgId: req.user.orgId,
      status: req.query.status,
      search: req.query.search,
      limit: Number(req.query.limit || 50),
      offset: Number(req.query.offset || 0),
    });
    res.json({ items });
  } catch (e) {
    console.error('[QUOTES] list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getOne(req, res) {
  try {
    const out = await svc.getQuote(Number(req.params.id), req.user.orgId);
    if (!out) return res.status(404).json({ message: 'Not found' });
    res.json(out);
  } catch (e) {
    console.error('[QUOTES] get error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function create(req, res) {
  try {
    const { customerId, validUntil, items, note } = req.body || {};
    if (!items?.length) return res.status(400).json({ message: 'items required' });

    // --- CORRECCIÓN DE AUDITORÍA ---
    // Pasar el userId (createdBy) al servicio
    const out = await svc.createQuote({
      orgId: req.user.orgId,
      customerId,
      validUntil,
      items,
      note,
      createdBy: req.user.uid // <-- ID del usuario para auditoría
    });

    res.status(201).json(out);
  } catch (e) {
    if (e.message === 'RULE_NOT_FOUND') return res.status(400).json({ message: 'Numbering rule not found' });
    if (e.message === 'FORBIDDEN_CUSTOMER') return res.status(400).json({ message: 'Customer not found or does not belong to this organization.' });
    if (e.message.startsWith('FORBIDDEN_OR_NOT_FOUND')) return res.status(400).json({ message: e.message });
    console.error('[QUOTES] create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function update(req, res) {
  try {
    // --- CORRECCIÓN DE AUDITORÍA ---
    // Pasar el userId (updatedBy) al servicio
    await svc.updateQuote({
      orgId: req.user.orgId,
      quoteId: Number(req.params.id),
      payload: req.body || {},
      updatedBy: req.user.uid // <-- ID del usuario para auditoría
    });

    res.json({ ok: true });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ message: 'Not found' });
    if (e.message === 'FORBIDDEN_CUSTOMER') return res.status(400).json({ message: 'Customer not found or does not belong to this organization.' });
    console.error('[QUOTES] update error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function convert(req, res) {
  try {
    const { branchId, posCode, docType, sellerId } = req.body || {};
    if (!branchId || !posCode || !docType) return res.status(400).json({ message: 'branchId, posCode, docType required' });

    // El servicio convertToSale ya maneja la auditoría internamente
    const out = await svc.convertToSale({
      orgId: req.user.orgId,
      quoteId: Number(req.params.id),
      branchId: Number(branchId),
      posCode: String(posCode),
      docType: String(docType),
      sellerId: sellerId || req.user.uid // sellerId (que es el userId) se pasa al servicio
    });

    res.json(out);
  } catch (e) {
    // Manejar errores específicos de la conversión
    if (e.message.startsWith('INSUFFICIENT_STOCK')) {
         return res.status(400).json({ message: e.message });
    }
    if (e.message === 'NOT_FOUND') return res.status(404).json({ message: 'Not found' });
    if (e.message === 'ALREADY_CONVERTED') return res.status(409).json({ message: 'Already converted' });
    if (e.message === 'FORBIDDEN_CUSTOMER') return res.status(400).json({ message: 'Customer associated with quote is invalid.' });
    if (e.message === 'QUOTE_HAS_NO_ITEMS') return res.status(400).json({ message: 'Quote has no valid items to convert.' });

    console.error('[QUOTES] convert error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { list, getOne, create, update, convert };
