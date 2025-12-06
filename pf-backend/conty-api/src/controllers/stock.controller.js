// src/controllers/stock.controller.js
const svc = require('../services/stock.service');

// Función de guardia (si la usas, asegúrate de que maneje errores async)
function ownerOrgGuard(req, orgId) {
  // Owner solo su organización
  if (req.user.roleId === 2 && req.user.orgId !== orgId) {
    const err = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }
  // Admin (rol 1) puede pasar si orgId se proveyó
  if (req.user.roleId === 1 && !orgId) {
      const err = new Error('orgId required for Admin role');
      err.status = 400;
      throw err;
  }
}

exports.getOverview = async (req, res) => {
  try {
    // ANTES: const orgId = req.user.roleId === 2 ? req.user.orgId : Number(req.query.orgId);
    
    // AHORA: Si el usuario tiene orgId (Rol 2 o 3), úsalo. Si es Admin (1), búscalo en query.
    const orgId = req.user.orgId || Number(req.query.orgId);
    
    if (!orgId) return res.status(400).json({ message: 'orgId required' });

    // ownerOrgGuard(req, orgId); // Esta guardia ya está implícita en la lógica de orgId

    const branchId = req.query.branchId ? Number(req.query.branchId) : null;
    const noMovementDays = req.query.noMovementDays ? Number(req.query.noMovementDays) : 90;

    const data = await svc.getStockOverview({ orgId, branchId, noMovementDays });
    res.json(data);
  } catch (e) {
    console.error('STOCK_OVERVIEW_ERROR:', e);
    res.status(e.status || 500).json({ message: e.message || 'Server error' });
  }
};

exports.listMovements = async (req, res) => {
  try {
    // ANTES: const orgId = req.user.roleId === 2 ? req.user.orgId : Number(req.query.orgId);
    
    // AHORA:
    const orgId = req.user.orgId || Number(req.query.orgId);
    
    if (!orgId) return res.status(400).json({ message: 'orgId required' });
    // ownerOrgGuard(req, orgId);

    const filters = {
      orgId,
      from: req.query.from || null,
      to: req.query.to || null,
      type: req.query.type || null,
      branchId: req.query.branchId ? Number(req.query.branchId) : null,
      q: req.query.q || null,
    };
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);

    const { items, total } = await svc.listMovements(filters, { limit, offset });
    res.json({ items, total, limit, offset });
  } catch (e) {
    console.error('STOCK_MOV_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createMovement = async (req, res) => {
  try {
    const { type, variantId, quantity, branchId, refCode, note } = req.body || {};
    const orgId = req.user.orgId; // Se toma del token (Roles 2 o 3)

    // Validación de campos básicos
    if (!branchId || !type || !variantId || !quantity)
      return res.status(400).json({ message: 'Missing fields: branchId, type, variantId, quantity' });

    // TODO: Validación de Seguridad - ¿Pertenece 'branchId' a 'orgId'?
    // El servicio createMovement debería validar esto internamente si no lo hace ya.

    const id = await svc.createSingleMovement({
      orgId,
      branchId: Number(branchId),
      type,
      variantId: Number(variantId),
      quantity: Number(quantity),
      ref_code: refCode || null,
      note: note || null,
      userId: req.user.uid || null,
    });
    res.status(201).json({ id });
  } catch (e) {
     // --- MANEJO DE ERRORES ESPECÍFICOS ---
    if (e.message.startsWith('INSUFFICIENT_STOCK')) {
        return res.status(400).json({ message: e.message });
    }
    if (e.message.startsWith('FORBIDDEN_OR_NOT_FOUND')) {
         return res.status(400).json({ message: e.message });
    }
    console.error('STOCK_MOV_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listTransfers = async (req, res) => {
  try {
    const orgId = req.user.orgId; // Solo roles de org
    const branchId = req.query.branchId ? Number(req.query.branchId) : null;
    const items = await svc.listTransfers({ orgId, branchId });
    res.json({ items });
  } catch (e) {
    console.error('STOCK_TRANSFER_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const orgId = req.user.orgId; // Solo rol 2 (Owner)

    const { originBranchId, destBranchId, items, transferRef, note } = req.body || {};
    if (!originBranchId || !destBranchId || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'Bad request: originBranchId, destBranchId, e items (array) son requeridos.' });
    }

    // TODO: Validar que originBranchId y destBranchId pertenezcan a orgId

    const out = await svc.createTransferOUT({
      orgId,
      originBranchId: Number(originBranchId),
      destBranchId: Number(destBranchId),
      transfer_ref: transferRef || null,
      userId: req.user.uid || null,
      items,
      note: note || null,
    });

    res.status(201).json(out);
  } catch (e) {
     // --- MANEJO DE ERRORES ESPECÍFICOS ---
    if (e.message.startsWith('INSUFFICIENT_STOCK')) {
        return res.status(400).json({ message: e.message });
    }
     if (e.message.startsWith('FORBIDDEN_OR_NOT_FOUND')) {
         return res.status(400).json({ message: e.message });
    }
    console.error('STOCK_TRANSFER_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.receiveTransfer = async (req, res) => {
  try {
    const orgId = req.user.orgId; // Rol de org
    const transfer_ref = req.params.ref;
    const destBranchId = req.body?.branchId ? Number(req.body.branchId) : (req.user.branchId || null); // Usar branchId del body o del token

    const out = await svc.receiveTransferIN({
      orgId,
      transfer_ref,
      destBranchId: Number(destBranchId),
      userId: req.user.uid || null,
    });

    if (out.alreadyReceived) return res.status(409).json({ message: 'Already received' });
    res.status(201).json(out);
  } catch (e) {
    if (e.message.startsWith('TRANSFER_OUT_NOT_FOUND') || e.message.startsWith('FORBIDDEN_BRANCH')) {
         return res.status(404).json({ message: e.message });
    }
     if (e.message.startsWith('DEST_BRANCH_REQUIRED')) {
         return res.status(400).json({ message: e.message });
     }
    console.error('STOCK_TRANSFER_RECEIVE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listInventorySessions = async (req, res) => {
  try {
    const orgId = req.user.orgId; // Rol de org
    const items = await svc.listInventorySessions({
      orgId,
      branchId: req.query.branchId ? Number(req.query.branchId) : null,
      status: req.query.status || null,
    });
    res.json({ items });
  } catch (e) {
    console.error('INV_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createInventorySession = async (req, res) => {
  try {
    const orgId = req.user.orgId; // Solo rol 2 (Owner)
    const { branchId, onlyDifferences = false } = req.body || {};
    if (!branchId) return res.status(400).json({ message: 'branchId required' });

    const id = await svc.createInventorySession({
      orgId,
      branchId: Number(branchId),
      onlyDifferences: !!onlyDifferences,
      userId: req.user.uid || null,
    });
    res.status(201).json({ id });
  } catch (e) {
    if (e.message.startsWith('FORBIDDEN_BRANCH')) {
        return res.status(403).json({ message: e.message });
    }
    console.error('INV_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInventorySession = async (req, res) => {
  try {
    const orgId = req.user.orgId; // Rol de org
    const id = Number(req.params.id);

    // --- CORRECCIÓN DE SEGURIDAD (Cerrar ¡PELIGRO!) ---
    // Pasar orgId al servicio para validación
    const data = await svc.getInventorySession(id, orgId);

    if (!data) return res.status(404).json({ message: 'Not found' });
    res.json(data);
  } catch (e) {
     if (e.message.startsWith('FORBIDDEN')) {
        return res.status(403).json({ message: e.message });
     }
    console.error('INV_GET_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.countInventoryItem = async (req, res) => {
  try {
    const id = Number(req.params.id); // Session ID
    const orgId = req.user.orgId; // Rol de org
    const { variantId, countedQty } = req.body || {};

    if (variantId === undefined || countedQty === undefined) { // Permitir countedQty = 0
      return res.status(400).json({ message: 'variantId & countedQty required' });
    }

    // --- CORRECCIÓN DE SEGURIDAD (Cerrar ¡PELIGRO!) ---
    // Pasar orgId al servicio para validación
    await svc.countInventoryItem(id, Number(variantId), Number(countedQty), orgId);

    res.json({ ok: true });
  } catch (e) {
     if (e.message.startsWith('FORBIDDEN_OR_NOT_OPEN')) {
        return res.status(403).json({ message: e.message });
     }
    console.error('INV_COUNT_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveInventorySession = async (req, res) => {
  try {
    const id = Number(req.params.id); // Session ID
    const orgId = req.user.orgId; // Solo rol 2 (Owner)

    // --- CORRECCIÓN DE AUDITORÍA Y SEGURIDAD ---
    // Pasar orgId y userId
    const out = await svc.approveInventorySession(id, req.user.uid || null, orgId);

    res.json(out);
  } catch (e) {
     if (e.message.startsWith('FORBIDDEN') || e.message.startsWith('NOT_FOUND') || e.message.startsWith('INVALID_STATUS')) {
        return res.status(400).json({ message: e.message });
     }
    console.error('INV_APPROVE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelInventorySession = async (req, res) => {
  try {
    const id = Number(req.params.id); // Session ID
    const orgId = req.user.orgId; // Solo rol 2 (Owner)

    // --- CORRECCIÓN DE AUDITORÍA Y SEGURIDAD ---
    // Pasar orgId y userId
    await svc.cancelInventorySession(id, req.user.uid || null, orgId);

    res.json({ ok: true });
  } catch (e) {
    console.error('INV_CANCEL_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchProductsForStock = async (req, res) => {
  try {
    const orgId = req.user.orgId; // Rol de org
    const branchId = Number(req.query.branchId || req.user.branchId || 0) || null;
    const q = String(req.query.q || '');

    const items = await svc.searchProductsForStock({ orgId, branchId, q });
    res.json({ items });
  } catch (e) {
    console.error('STOCK_SEARCH_PROD_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
