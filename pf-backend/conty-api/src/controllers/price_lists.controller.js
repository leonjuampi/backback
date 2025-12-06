// src/controllers/price_lists.controller.js
const svc = require('../services/price_lists.service');

async function list(req, res) {
  try {
    const roleId = req.user.roleId;

    // Misma lógica corregida
    const orgId = (roleId === 1) 
      ? (req.query.orgId ? Number(req.query.orgId) : undefined) 
      : req.user.orgId;

    if (!orgId && roleId !== 1) {
         return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Nota: Si eres Admin y no mandas orgId, el servicio actual devolverá vacío 
    // porque espera un ID sí o sí. Para Admin, habría que modificar el servicio, 
    // pero para tu Vendedor (Rol 3), esto soluciona el problema visual.
    
    const items = await svc.listPriceLists(orgId);
    res.json({ items });
  } catch (e) {
    console.error('[PL_CONTROLLER] list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function create(req, res) {
  try {
    const orgId = req.user.orgId; // Solo Owner (rol 2)
    const userId = req.user.uid; // <-- Para auditoría
    const { name, description, is_default } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El campo "name" es requerido' });
    }

    // Pasar userId al servicio
    const id = await svc.createPriceList({
      orgId,
      name,
      description: description || null,
      is_default: is_default || false,
      createdBy: userId
    });

    res.status(201).json({ id });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY' && e.message.includes('uq_pricelist_org_name_active')) {
      return res.status(409).json({ message: 'Ya existe una lista de precios con ese nombre.' });
    }
    console.error('[PL_CONTROLLER] create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function update(req, res) {
  try {
    const orgId = req.user.orgId; // Solo Owner
    const userId = req.user.uid; // <-- Para auditoría
    const id = Number(req.params.id);
    const payload = req.body;

    // Pasar userId al servicio
    const affectedRows = await svc.updatePriceList(id, orgId, payload, userId);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Lista de precios no encontrada o no pertenece a esta organización.' });
    }
    res.json({ message: 'Updated' });
  } catch (e) {
     if (e.code === 'ER_DUP_ENTRY') {
       return res.status(409).json({ message: 'Ya existe otra lista de precios con ese nombre.' });
     }
    console.error('[PL_CONTROLLER] update error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function remove(req, res) {
  try {
    const orgId = req.user.orgId; // Solo Owner
    const userId = req.user.uid; // <-- Para auditoría
    const id = Number(req.params.id);

    // Pasar userId al servicio
    const affectedRows = await svc.deletePriceList(id, orgId, userId);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Lista de precios no encontrada o no pertenece a esta organización.' });
    }
    res.status(204).send();
  } catch (e) {
    console.error('[PL_CONTROLLER] delete error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { list, create, update, remove };
