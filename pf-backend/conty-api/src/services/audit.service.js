// src/services/audit.service.js
const pool = require('../config/db');

/**
 * Registra una acción en el log de auditoría.
 * Esta función es 'fire-and-forget' (no bloquea la respuesta al usuario).
 * NO debe usar una 'conn' transaccional para asegurar que el log se guarde
 * incluso si la transacción principal falla (ej. en un LOGIN_FAIL).
 *
 * @param {object} data - Datos de la auditoría
 * @param {number} [data.orgId] - ID de la Organización
 * @param {number} [data.userId] - ID del Usuario que realiza la acción
 * @param {string} data.actionType - Tipo de acción (ej. 'CREATE', 'LOGIN_FAIL')
 * @param {string} [data.entityType] - Tipo de entidad afectada (ej. 'PRODUCT')
 * @param {number} [data.entityId] - ID de la entidad afectada
 * @param {object} [data.details] - JSON con detalles adicionales
 */
async function logAction(data) {
  const { orgId, userId, actionType, entityType, entityId, details } = data;

  try {
    // Insertamos en la tabla de auditoría
    await pool.query(
      `INSERT INTO audit_log (org_id, user_id, action_type, entity_type, entity_id, details_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orgId || null,
        userId || null,
        actionType,
        entityType || null,
        entityId || null,
        details ? JSON.stringify(details) : null
      ]
    );
  } catch (e) {
    // Si la auditoría falla, solo lo logueamos en consola.
    // NO debemos detener la aplicación principal por esto.
    console.error(`--- CRITICAL: AUDIT LOG WRITE FAILED ---`);
    console.error(`Action: ${actionType}, User: ${userId}, Org: ${orgId}`);
    console.error(e.message);
    console.error(`----------------------------------------`);
  }
}

async function listAuditLogs({ orgId, userId, actionType, entityType, entityId, from, to, limit = 50, offset = 0 }) {
  const wh = [];
  const params = [];

  // Filtros
  if (orgId) { wh.push('a.org_id = ?'); params.push(orgId); }
  if (userId) { wh.push('a.user_id = ?'); params.push(userId); }
  if (actionType) { wh.push('a.action_type = ?'); params.push(actionType); }
  if (entityType) { wh.push('a.entity_type = ?'); params.push(entityType); }
  if (entityId) { wh.push('a.entity_id = ?'); params.push(entityId); }

  if (from) { wh.push('a.created_at >= ?'); params.push(from); }
  if (to) { wh.push('a.created_at < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(to); } // Incluir todo el día final

  const whereClause = wh.length ? `WHERE ${wh.join(' AND ')}` : '';

  // Consulta principal con JOINs para traer nombres legibles
  const sql = `
    SELECT
      a.id, a.org_id, a.user_id, a.action_type, a.entity_type, a.entity_id, a.details_json, a.created_at,
      u.username AS performedBy,
      o.name AS orgName
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN organizations o ON o.id = a.org_id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(sql, [...params, Number(limit), Number(offset)]);

  // Consulta para contar el total (para paginación)
  const [cnt] = await pool.query(`SELECT COUNT(*) AS total FROM audit_log a ${whereClause}`, params);

  return {
      items: rows.map(row => ({
          ...row,
          details: row.details_json // Ya viene parseado por el driver mysql2 si es columna JSON, si no: JSON.parse(row.details_json || '{}')
      })),
      total: cnt[0].total
  };
}

module.exports = {
  logAction,
  listAuditLogs
};
