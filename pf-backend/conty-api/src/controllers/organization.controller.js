// src/controllers/organization.controller.js
const svc = require('../services/organization.service');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

async function listOrgs(req, res) {
  try {
    const roleId = req.user.roleId;
    const search = req.query.search;
    // Lógica para determinar qué orgID listar
    const orgId = (roleId === 2) ? req.user.orgId : (req.query.orgId ? Number(req.query.orgId) : undefined);

    // Si es Rol 2, orgId está definido. Si es Rol 1, puede ser undefined (listar todas) o un ID específico.
    // Si es Rol 3+, el middleware de ruta (authorizeRoles) ya lo debería haber bloqueado.

    const items = await svc.listOrganizations({ orgId, search });
    res.json({ items });
  } catch (e) {
    console.error('ORG_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getOrg(req, res) {
  try {
    const id = Number(req.params.id);
    // Rol 2 (Owner) solo puede ver su propia org
    if (req.user.roleId === 2 && req.user.orgId !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Rol 1 (Admin) puede ver cualquiera (implícito)

    const org = await svc.getOrganization(id);
    if (!org) return res.status(404).json({ message: 'Not found' });
    res.json(org);
  } catch (e) {
    console.error('ORG_GET_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createOrg(req, res) {
  try {
    // Solo Rol 2 (Owner) puede crear (y solo si aún no tiene org)
    if (req.user.roleId !== 2) return res.status(403).json({ message: 'Forbidden' });
    if (req.user.orgId) return res.status(400).json({ message: 'User already belongs to an organization' });

    const {
      legalName, taxId, taxCondition, address,
      timezone, logoUrl, currency, senderEmail
    } = req.body || {};

    if (!legalName) return res.status(400).json({ message: 'legalName is required' });

    // La función del servicio ya está lista para la auditoría (recibe createdBy)
    const id = await svc.createOrganization({
      legalName, taxId, taxCondition, address,
      timezone, logoUrl, currency, senderEmail,
      createdBy: req.user.uid
    });

    // Actualiza org_id del usuario que la creó
    await pool.query(`UPDATE users SET org_id = ? WHERE id = ?`, [id, req.user.uid]);

    // Reconstruir token con nueva org
    const payload = {
      uid: req.user.uid,
      roleId: req.user.roleId,
      username: req.user.username,
      email: req.user.email,
      orgId: id, // <-- ID de la nueva Org
      branchId: null,
      branchIds: []
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });

    res.status(201).json({ id, token, user: payload });
  } catch (e) {
    console.error('ORG_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateOrg(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.uid; // <-- Para auditoría

    // Rol 2 (Owner) solo puede actualizar su propia org
    if (req.user.roleId === 2 && req.user.orgId !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Rol 1 (Admin) puede actualizar cualquiera (implícito)

    // Pasar userId para el log de auditoría
    await svc.updateOrganization(id, req.body || {}, userId);

    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('ORG_UPDATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteOrg(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.uid; // <-- Para auditoría

    // Rol 2 (Owner) solo puede borrar su propia org
    if (req.user.roleId === 2 && req.user.orgId !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Rol 1 (Admin) puede borrar cualquiera (implícito)

    // Pasar userId para el log de auditoría
    await svc.softDeleteOrganization(id, userId);

    res.status(204).send();
  } catch (e) {
    console.error('ORG_DELETE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { listOrgs, getOrg, createOrg, updateOrg, deleteOrg };
