// src/services/branch.service.js
const pool = require('../config/db');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

function whereBranches({ orgId, search, status, channel }) {
  const wh = ['b.is_deleted = 0'];
  const params = [];
  if (orgId) { wh.push('b.org_id = ?'); params.push(orgId); }
  if (search) { wh.push('b.name LIKE ?'); params.push(`%${search}%`); }
  if (status) { wh.push('b.status = ?'); params.push(status); }
  if (channel) { wh.push('b.channel = ?'); params.push(channel); }
  return { where: `WHERE ${wh.join(' AND ')}`, params };
}

async function listBranches({ orgId, search, status, channel }) {
  const { where, params } = whereBranches({ orgId, search, status, channel });
  const [rows] = await pool.query(`
    SELECT
      b.id,
      b.org_id AS orgId,
      b.name,
      b.address,
      b.phone,
      b.channel,
      b.printer_name AS printerName,
      b.printer_code AS printerCode,
      b.status,
      b.created_at AS createdAt
    FROM branches b
    ${where}
    ORDER BY b.name ASC
  `, params);
  return rows;
}

async function getBranch(id) {
  const [rows] = await pool.query(`
    SELECT
      b.id,
      b.org_id AS orgId,
      b.name,
      b.address,
      b.phone,
      b.channel,
      b.printer_name AS printerName,
      b.printer_code AS printerCode,
      b.status,
      b.created_at AS createdAt
    FROM branches b
    WHERE b.id = ? AND b.is_deleted = 0
    LIMIT 1
  `, [id]);
  return rows[0] || null;
}

async function createBranch({ orgId, name, address, phone, channel, printerName, printerCode, status, createdBy }) {
  const [res] = await pool.query(`
    INSERT INTO branches (org_id, name, address, phone, channel, printer_name, printer_code, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `, [
    orgId,
    name,
    address || null,
    phone || null,
    channel || 'LOCAL',
    printerName || null,
    printerCode || null,
    status || 'ACTIVE'
  ]);
  const branchId = res.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR SUCURSAL ---
  logAction({
    orgId: orgId,
    userId: createdBy,
    actionType: 'CREATE',
    entityType: 'BRANCH',
    entityId: branchId,
    details: { name: name, channel: channel }
  });
  // --- FIN AUDITORÍA ---

  return branchId;
}

async function updateBranch(id, data, userId) { // <-- Acepta userId
  const map = {
    name: 'name',
    address: 'address',
    phone: 'phone',
    channel: 'channel',
    printerName: 'printer_name',
    printerCode: 'printer_code',
    status: 'status'
  };

  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(data || {})) {
    if (v === undefined) continue;
    const col = map[k];
    if (!col) continue;
    sets.push(`${col} = ?`);
    params.push(v);
  }
  if (!sets.length) return;

  // Opcional: Obtener orgId para el log si no se pasó desde el controlador
  // const branch = await getBranch(id);
  // const orgId = branch ? branch.orgId : null;

  const [result] = await pool.query(`
    UPDATE branches SET ${sets.join(', ')}
    WHERE id = ? AND is_deleted = 0
  `, [...params, id]);

  if (result.affectedRows > 0) {
      // --- PUNTO DE AUDITORÍA: ACTUALIZAR SUCURSAL ---
      // Nota: No tenemos orgId directo aquí fácilmente sin otra consulta,
      // pero sabemos que pertenece a la org del usuario.
      // Podríamos hacer una consulta extra o confiar en que userId es suficiente.
      logAction({
        // orgId: orgId, // Opcional si queremos ser precisos
        userId: userId,
        actionType: 'UPDATE',
        entityType: 'BRANCH',
        entityId: id,
        details: { updatedFields: sets.map(s => s.split(' =')[0]) }
      });
      // --- FIN AUDITORÍA ---
  }
}

async function softDeleteBranch(id, userId) { // <-- Acepta userId
  const [result] = await pool.query(`
    UPDATE branches SET is_deleted = 1, deleted_at = NOW()
    WHERE id = ? AND is_deleted = 0
  `, [id]);

  if (result.affectedRows > 0) {
      // --- PUNTO DE AUDITORÍA: ELIMINAR SUCURSAL ---
      logAction({
        userId: userId,
        actionType: 'DELETE',
        entityType: 'BRANCH',
        entityId: id
      });
      // --- FIN AUDITORÍA ---
  }
}

module.exports = {
  listBranches,
  getBranch,
  createBranch,
  updateBranch,
  softDeleteBranch,
};
