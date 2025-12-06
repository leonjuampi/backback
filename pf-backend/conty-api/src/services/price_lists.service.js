// src/services/price_lists.service.js
const pool = require('../config/db');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

async function listPriceLists(orgId) {
  const [rows] = await pool.query(
    `SELECT id, org_id, name, description, is_default
     FROM price_lists
     WHERE org_id = ? AND is_deleted = 0
     ORDER BY name ASC`,
    [orgId]
  );
  // Convertir is_default (TINYINT) a booleano
  return rows.map(r => ({ ...r, is_default: !!r.is_default }));
}

async function createPriceList(data) {
  const { orgId, name, description, is_default, createdBy } = data;

  // Si esta es la default, asegurarse que no haya otras
  if (is_default) {
      await pool.query(
          'UPDATE price_lists SET is_default = 0 WHERE org_id = ? AND is_deleted = 0',
          [orgId]
      );
  }

  const [result] = await pool.query(
    `INSERT INTO price_lists
       (org_id, name, description, is_default, is_deleted)
     VALUES (?, ?, ?, ?, 0)`,
    [orgId, name, description, is_default ? 1 : 0]
  );
  const listId = result.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR LISTA DE PRECIOS ---
  logAction({
    orgId: orgId,
    userId: createdBy,
    actionType: 'CREATE',
    entityType: 'PRICE_LIST',
    entityId: listId,
    details: { name: name, isDefault: is_default }
  });
  // --- FIN AUDITORÍA ---

  return listId;
}

async function updatePriceList(id, orgId, data, userId) { // <-- Acepta userId
  const fields = [];
  const params = [];
  const allowedUpdates = ['name', 'description', 'is_default'];

  // Si esta es la nueva default, quitar la marca de las otras
  if (data.is_default) {
       await pool.query(
          'UPDATE price_lists SET is_default = 0 WHERE org_id = ? AND is_deleted = 0 AND id != ?',
          [orgId, id]
       );
  }

  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      const value = (key === 'is_default') ? (data[key] ? 1 : 0) : data[key];
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) return 0;

  const sql = `UPDATE price_lists
               SET ${fields.join(', ')}
               WHERE id = ? AND org_id = ? AND is_deleted = 0`;

  const [result] = await pool.query(sql, [...params, id, orgId]);

  if (result.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ACTUALIZAR LISTA DE PRECIOS ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'UPDATE',
      entityType: 'PRICE_LIST',
      entityId: id,
      details: { updatedFields: Object.keys(data) }
    });
    // --- FIN AUDITORÍA ---
  }
  return result.affectedRows;
}

async function deletePriceList(id, orgId, userId) { // <-- Acepta userId
  // Opcional: ¿Se puede borrar la lista 'default'?
  // const [check] = await pool.query('SELECT 1 FROM price_lists WHERE id = ? AND is_default = 1 AND is_deleted = 0', [id]);
  // if (check.length > 0) {
  //    throw new Error('DEFAULT_LIST_DELETE: No se puede eliminar la lista de precios por defecto.');
  // }

  const [result] = await pool.query(
    `UPDATE price_lists
     SET is_deleted = 1, deleted_at = NOW(), is_default = 0
     WHERE id = ? AND org_id = ? AND is_deleted = 0`,
    [id, orgId]
  );

  if (result.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ELIMINAR LISTA DE PRECIOS ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'DELETE',
      entityType: 'PRICE_LIST',
      entityId: id
    });
    // --- FIN AUDITORÍA ---
  }
  return result.affectedRows;
}

module.exports = {
  listPriceLists,
  createPriceList,
  updatePriceList,
  deletePriceList
};
