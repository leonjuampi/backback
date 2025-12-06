// src/services/payment_methods.service.js
const pool = require('../config/db');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

async function listPaymentMethods(orgId) {
  const [rows] = await pool.query(
    `SELECT id, org_id AS orgId, name, kind, max_installments, surcharge_pct,
            discount_pct, ticket_note, active
     FROM payment_methods
     WHERE org_id = ? AND is_deleted = 0
     ORDER BY name ASC`,
    [orgId]
  );
  return rows;
}

async function createPaymentMethod(data) {
  const { orgId, name, kind, max_installments, surcharge_pct, discount_pct, ticket_note, active, createdBy } = data;

  const [result] = await pool.query(
    `INSERT INTO payment_methods
       (org_id, name, kind, max_installments, surcharge_pct, discount_pct, ticket_note, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [orgId, name, kind, max_installments, surcharge_pct, discount_pct, ticket_note, active]
  );
  const methodId = result.insertId;

  // --- AUDITORÍA ---
  logAction({
    orgId: orgId,
    userId: createdBy,
    actionType: 'CREATE',
    entityType: 'PAYMENT_METHOD',
    entityId: methodId,
    details: { name, kind }
  });
  // -----------------

  return methodId;
}

async function updatePaymentMethod(id, orgId, data, userId) {
  const fields = [];
  const params = [];
  const allowedUpdates = ['name', 'kind', 'max_installments', 'surcharge_pct', 'discount_pct', 'ticket_note', 'active'];

  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      const value = (key === 'active') ? (data[key] ? 1 : 0) : data[key];
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) return 0;

  const sql = `UPDATE payment_methods
               SET ${fields.join(', ')}
               WHERE id = ? AND org_id = ? AND is_deleted = 0`;

  const [result] = await pool.query(sql, [...params, id, orgId]);

  if (result.affectedRows > 0) {
    // --- AUDITORÍA ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'UPDATE',
      entityType: 'PAYMENT_METHOD',
      entityId: id,
      details: { updatedFields: Object.keys(data) }
    });
    // -----------------
  }
  return result.affectedRows;
}

async function deletePaymentMethod(id, orgId, userId) {
  const [result] = await pool.query(
    `UPDATE payment_methods
     SET is_deleted = 1, deleted_at = NOW()
     WHERE id = ? AND org_id = ? AND is_deleted = 0`,
    [id, orgId]
  );

  if (result.affectedRows > 0) {
    // --- AUDITORÍA ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'DELETE',
      entityType: 'PAYMENT_METHOD',
      entityId: id
    });
    // -----------------
  }
  return result.affectedRows;
}

module.exports = {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
};
