// src/controllers/branch.controller.js
const svc = require('../services/branch.service');

/**
 * OWNER (roleId=2) maneja únicamente branches de su organización.
 * ADMIN (roleId=1) puede listar/leer todas si se habilita via query (orgId).
 */

async function listBranches(req, res) {
  try {
    const roleId = req.user.roleId;
    
    // CORRECCIÓN:
    // Si es Admin (1), usa el query param o undefined (ver todas).
    // Si NO es Admin (Owner 2 o Vendedor 3), FORZAR su orgId.
    const orgId = (roleId === 1) 
      ? (req.query.orgId ? Number(req.query.orgId) : undefined) 
      : req.user.orgId;

    // Seguridad extra: Si no es Admin y no tiene orgId, error.
    if (roleId !== 1 && !orgId) {
        return res.status(403).json({ message: 'Forbidden: No organization assigned' });
    }

    const items = await svc.listBranches({
      orgId,
      search: req.query.search,
      status: req.query.status,
      channel: req.query.channel
    });
    res.json({ items });
  } catch (e) {
    console.error('BRANCH_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getBranch(req, res) {
  try {
    const id = Number(req.params.id);
    const b = await svc.getBranch(id);
    if (!b) return res.status(404).json({ message: 'Not found' });
    if (req.user.roleId === 2 && req.user.orgId !== b.orgId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(b);
  } catch (e) {
    console.error('BRANCH_GET_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createBranch(req, res) {
  try {
    if (req.user.roleId !== 2) return res.status(403).json({ message: 'Forbidden' });

    const orgId = req.body.orgId ? Number(req.body.orgId) : req.user.orgId;
    if (req.user.orgId !== orgId) return res.status(403).json({ message: 'Forbidden' });

    const { name, address, phone, channel, printerName, printerCode, status } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name is required' });

    const userId = req.user.uid; // <-- Para auditoría

    const id = await svc.createBranch({
      orgId,
      name,
      address,
      phone,
      channel,
      printerName,
      printerCode,
      status,
      createdBy: userId
    });
    res.status(201).json({ id });
  } catch (e) {
    console.error('BRANCH_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateBranch(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.uid; // <-- Para auditoría

    const b = await svc.getBranch(id);
    if (!b) return res.status(404).json({ message: 'Not found' });
    if (req.user.roleId === 2 && req.user.orgId !== b.orgId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await svc.updateBranch(id, req.body || {}, userId);
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('BRANCH_UPDATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteBranch(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.uid; // <-- Para auditoría

    const b = await svc.getBranch(id);
    if (!b) return res.status(404).json({ message: 'Not found' });
    if (req.user.roleId === 2 && req.user.orgId !== b.orgId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await svc.softDeleteBranch(id, userId);
    res.status(204).send();
  } catch (e) {
    console.error('BRANCH_DELETE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { listBranches, getBranch, createBranch, updateBranch, deleteBranch };
