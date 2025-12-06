// src/services/organization.service.js
const pool = require('../config/db');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

function orgWhere({ orgId, search, includeDeleted = false }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const wh = [];
  const params = [];
  if (!includeDeleted) wh.push('o.is_deleted = 0');
  if (orgId) { wh.push('o.id = ?'); params.push(orgId); }
  if (search) { wh.push('(o.name LIKE ? OR o.legal_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  return { where: wh.length ? `WHERE ${wh.join(' AND ')}` : '', params };
}

async function listOrganizations({ orgId, search, includeDeleted }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const { where, params } = orgWhere({ orgId, search, includeDeleted });
  const [rows] = await pool.query(`
    SELECT
      o.id,
      COALESCE(o.legal_name, o.name) AS legalName,
      o.tax_id AS taxId,
      o.tax_condition AS taxCondition,
      o.address,
      o.timezone,
      o.logo_url AS logoUrl,
      o.currency,
      o.sender_email AS senderEmail,
      o.created_at AS createdAt
    FROM organizations o
    ${where}
    ORDER BY o.id DESC
  `, params);
  return rows;
}

async function getOrganization(id) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [rows] = await pool.query(`
    SELECT
      o.id,
      COALESCE(o.legal_name, o.name) AS legalName,
      o.tax_id AS taxId,
      o.tax_condition AS taxCondition,
      o.address,
      o.timezone,
      o.logo_url AS logoUrl,
      o.currency,
      o.sender_email AS senderEmail,
      o.created_at AS createdAt,
      o.primary_color AS primaryColor,
      o.secondary_color AS secondaryColor
    FROM organizations o
    WHERE o.id = ? AND o.is_deleted = 0
    LIMIT 1
  `, [id]);
  return rows[0] || null;
}

async function createOrganization({
  legalName, taxId, taxCondition, address,
  timezone, logoUrl, currency, senderEmail, createdBy
}) {
  const [res] = await pool.query(`
    INSERT INTO organizations
      (name, legal_name, tax_id, tax_condition, address, timezone, logo_url, currency, sender_email, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
  `, [
    legalName,
    legalName,
    taxId || null,
    taxCondition || null,
    address || null,
    timezone || 'America/Argentina/Buenos_Aires',
    logoUrl || null,
    currency || 'ARS',
    senderEmail || null,
    createdBy || null
  ]);
  const orgId = res.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR ORGANIZACIÓN ---
  logAction({
    orgId: orgId, // La org recién creada
    userId: createdBy, // El Owner que la creó
    actionType: 'CREATE',
    entityType: 'ORGANIZATION',
    entityId: orgId,
    details: { legalName: legalName, taxId: taxId || null }
  });
  // --- FIN AUDITORÍA ---

  return orgId;
}

async function updateOrganization(id, data, userId) { // <-- Modificado para aceptar userId
  const map = {
    legalName: 'legal_name',
    taxId: 'tax_id',
    taxCondition: 'tax_condition',
    address: 'address',
    timezone: 'timezone',
    logoUrl: 'logo_url',
    currency: 'currency',
    senderEmail: 'sender_email',
    primaryColor: 'primary_color',
    secondaryColor: 'secondary_color'
  };

  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(data || {})) {
    if (v === undefined) continue;
    const col = map[k] || (k === 'name' ? 'name' : null);
    if (!col) continue;
    sets.push(`${col} = ?`);
    params.push(v);
  }
  if (!sets.length) return;

  const [result] = await pool.query(`
    UPDATE organizations SET ${sets.join(', ')}
    WHERE id = ? AND is_deleted = 0
  `, [...params, id]);

  if (result.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ACTUALIZAR ORGANIZACIÓN ---
    logAction({
      orgId: id, // La org afectada
      userId: userId, // Quién hizo el cambio
      actionType: 'UPDATE',
      entityType: 'ORGANIZATION',
      entityId: id,
      details: { updatedFields: sets.map(s => s.split(' =')[0]) } // Qué campos se cambiaron
    });
    // --- FIN AUDITORÍA ---
  }
}

async function softDeleteOrganization(id, userId) { // <-- Modificado para aceptar userId
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orgRes] = await conn.query(
      `UPDATE organizations SET is_deleted = 1, deleted_at = NOW()
       WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    if (orgRes.affectedRows === 0) {
        throw new Error('NOT_FOUND: Organización no encontrada o ya eliminada.');
    }

    // Bajar también sus sucursales
    await conn.query(
      `UPDATE branches SET is_deleted = 1, deleted_at = NOW()
       WHERE org_id = ? AND is_deleted = 0`,
      [id]
    );

    // Opcional: Bajar usuarios, productos, etc.? (Depende de tu lógica de negocio)

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: ELIMINAR ORGANIZACIÓN ---
    logAction({
      orgId: id, // La org afectada
      userId: userId, // Quién la borró
      actionType: 'DELETE',
      entityType: 'ORGANIZATION',
      entityId: id
    });
    // --- FIN AUDITORÍA ---

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  softDeleteOrganization,
};
