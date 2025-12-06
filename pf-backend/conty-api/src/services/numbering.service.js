// src/services/numbering.service.js
const pool = require('../config/db');
const dayjs = require('dayjs');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

function periodKeyFor(policy, now = new Date()) {
  // ... (Tu código existente aquí - sin cambios) ...
  if (policy === 'YEARLY') return dayjs(now).format('YYYY');
  if (policy === 'MONTHLY') return dayjs(now).format('YYYY-MM');
  return '*'; // NEVER
}

function formatNumber({ format, posCode, num, now = new Date() }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const pad = (n, len) => String(n).padStart(len, '0');
  return String(format)
    .replace(/\{PV\}/g, posCode)
    .replace(/\{NUM\}/g, String(num))
    .replace(/\{AÑO\}/g, dayjs(now).format('YYYY'))
    .replace(/\{MES\}/g, dayjs(now).format('MM'));
}

async function getRule(orgId, docType) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [rows] = await pool.query(
    `SELECT id, org_id AS orgId, doc_type AS docType, format, next_number AS nextNumber,
            padding, reset_policy AS resetPolicy, is_deleted
       FROM doc_numbering_rules
      WHERE org_id = ? AND doc_type = ? AND is_deleted = 0
      LIMIT 1`,
    [orgId, docType]
  );
  return rows[0] || null;
}

async function previewNext(orgId, docType, posCode) {
  // ... (Tu código existente aquí - sin cambios) ...
  const rule = await getRule(orgId, docType);
  if (!rule) throw new Error('RULE_NOT_FOUND');

  const num = String(rule.nextNumber).padStart(rule.padding, '0');
  const formatted = formatNumber({ format: rule.format, posCode, num });
  return { rule, formatted, number: num };
}

async function reserveNextNumber(conn, { orgId, docType, posCode }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [ruleRows] = await conn.query(
    `SELECT id, format, padding, reset_policy AS resetPolicy, next_number AS nextNumber
       FROM doc_numbering_rules
      WHERE org_id = ? AND doc_type = ? AND is_deleted = 0
      FOR UPDATE`,
    [orgId, docType]
  );
  const rule = ruleRows[0];
  if (!rule) throw new Error('RULE_NOT_FOUND');

  const pKey = periodKeyFor(rule.resetPolicy);
  await conn.query(
    `INSERT INTO doc_numbering_counters (org_id, doc_type, pos_code, period_key, last_number)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
    [orgId, docType, posCode, pKey]
  );

  const [cntRows] = await conn.query(
    `SELECT last_number AS lastNumber
       FROM doc_numbering_counters
      WHERE org_id = ? AND doc_type = ? AND pos_code = ? AND period_key = ?
      LIMIT 1`,
    [orgId, docType, posCode, pKey]
  );

  const num = String(cntRows[0].lastNumber).padStart(rule.padding, '0');
  const formatted = formatNumber({ format: rule.format, posCode, num });
  return { number: num, formatted };
}

async function listRules(orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [rows] = await pool.query(
    `SELECT id, org_id AS orgId, doc_type AS docType, format, next_number AS nextNumber,
            padding, reset_policy AS resetPolicy, is_deleted
       FROM doc_numbering_rules
      WHERE org_id = ? AND is_deleted = 0
      ORDER BY doc_type`,
    [orgId]
  );
  return rows;
}

async function upsertRule({ orgId, docType, format, nextNumber, padding, resetPolicy, userId }) { // <-- Acepta userId
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO doc_numbering_rules (org_id, doc_type, format, next_number, padding, reset_policy)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         format = VALUES(format),
         next_number = VALUES(next_number),
         padding = VALUES(padding),
         reset_policy = VALUES(reset_policy),
         is_deleted = 0`,
      [orgId, docType, format, nextNumber, padding, resetPolicy]
    );

    // Inicializar contador (tu corrección para evitar fricción)
    const pKey = periodKeyFor(resetPolicy, new Date());
    await conn.query(
        `INSERT IGNORE INTO doc_numbering_counters
            (org_id, doc_type, pos_code, period_key, last_number)
        VALUES (?, ?, ?, ?, 0)`,
        [orgId, docType, '0001', pKey]
    );

    await conn.commit();

    // --- PUNTO DE AUDITORÍA: UPSERT REGLA NUMERACIÓN ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'UPDATE', // Lo generalizamos como UPDATE o CREATE
      entityType: 'NUMBERING_RULE',
      entityId: null, // No tenemos el ID fácil aquí sin otra consulta, pero docType es clave
      details: { docType: docType, format: format }
    });
    // --- FIN AUDITORÍA ---

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function deleteRule(orgId, docType, userId) { // <-- Acepta userId
  const [result] = await pool.query(
    `UPDATE doc_numbering_rules SET is_deleted = 1, deleted_at = NOW()
      WHERE org_id = ? AND doc_type = ? AND is_deleted = 0`,
    [orgId, docType]
  );

  if (result.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ELIMINAR REGLA NUMERACIÓN ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'DELETE',
      entityType: 'NUMBERING_RULE',
      entityId: null,
      details: { docType: docType }
    });
    // --- FIN AUDITORÍA ---
  }
}

module.exports = {
  getRule,
  previewNext,
  reserveNextNumber,
  listRules,
  upsertRule,
  deleteRule,
  periodKeyFor,
  formatNumber,
};
