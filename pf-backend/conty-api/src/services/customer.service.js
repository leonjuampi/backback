// src/services/customer.service.js
const pool = require('../config/db');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

function buildBalanceSubquery(orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  return `
    SELECT
      t.customer_id,
      SUM(
        CASE t.type
          WHEN 'INVOICE'     THEN t.amount
          WHEN 'CREDIT_NOTE' THEN -t.amount
          WHEN 'PAYMENT'     THEN -t.amount
          WHEN 'ADJUSTMENT'  THEN  t.amount
          ELSE 0
        END
      ) AS balance,
      MAX(CASE WHEN t.type='INVOICE' THEN t.trx_date END) AS last_invoice_at
    FROM ar_transactions t
    JOIN customers c_inner ON c_inner.id = t.customer_id AND c_inner.org_id = ${pool.escape(orgId)} AND c_inner.is_deleted = 0
    WHERE t.is_deleted = 0
    GROUP BY t.customer_id
  `;
}

function filtersWhere({ orgId, search, priceListId, status, withDebt, noPurchasesDays }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const wh = ['c.org_id = ?', 'c.is_deleted = 0'];
  const params = [orgId];
  if (search) { wh.push(`(c.name LIKE ? OR c.tax_id LIKE ? OR c.email LIKE ?)`); const s = `%${search}%`; params.push(s, s, s); }
  if (priceListId) { wh.push(`c.price_list_id = ?`); params.push(priceListId); }
  if (status) { wh.push(`c.status = ?`); params.push(status); }
  if (withDebt !== undefined) { wh.push(withDebt ? `(IFNULL(b.balance,0) > 0)` : `(IFNULL(b.balance,0) <= 0)`); }
  if (noPurchasesDays) { wh.push(`(c.last_purchase_at IS NULL OR c.last_purchase_at < (NOW() - INTERVAL ? DAY))`); params.push(noPurchasesDays); }
  return { where: wh.length ? `WHERE ${wh.join(' AND ')}` : '', params };
}

async function queryCustomers(filters, { limit, offset }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const bal = buildBalanceSubquery(filters.orgId);
  const { where, params } = filtersWhere(filters);
  const sql = `
    SELECT
      c.id, c.name, c.tax_id AS taxId, c.email, c.phone, c.address,
      c.tax_condition AS taxCondition, c.status, c.last_purchase_at AS lastPurchaseAt,
      pl.name AS priceListName, pl.id AS priceListId,
      IFNULL(b.balance, 0) AS balance
    FROM customers c
    JOIN price_lists pl ON pl.id = c.price_list_id
    LEFT JOIN (${bal}) b ON b.customer_id = c.id
    ${where}
    ORDER BY c.name ASC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(sql, [...params, limit, offset]);
  const ids = rows.map(r => r.id);
  let tagsById = {};
  if (ids.length) {
    const [tagRows] = await pool.query(`
      SELECT ct.customer_id AS customerId, t.name
      FROM customer_tags ct
      JOIN tags t ON t.id = ct.tag_id
      JOIN customers c_inner ON c_inner.id = ct.customer_id AND c_inner.is_deleted = 0
      WHERE ct.customer_id IN (${ids.map(() => '?').join(',')}) AND t.org_id = ? AND ct.is_deleted = 0 AND t.is_deleted = 0
    `, [...ids, filters.orgId]);
    for (const tr of tagRows) {
      tagsById[tr.customerId] = tagsById[tr.customerId] || [];
      tagsById[tr.customerId].push(tr.name);
    }
  }
  return rows.map(r => ({ ...r, tags: tagsById[r.id] || [] }));
}

async function countCustomers(filters) {
  // ... (Tu código existente aquí - sin cambios) ...
  const bal = buildBalanceSubquery(filters.orgId);
  const { where, params } = filtersWhere(filters);
  const [rows] = await pool.query(`
    SELECT COUNT(*) AS total
    FROM customers c
    LEFT JOIN (${bal}) b ON b.customer_id = c.id
    ${where}
  `, params);
  return rows[0]?.total || 0;
}

async function getCustomer(id, orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [rows] = await pool.query(`
    SELECT
      c.id, c.name, c.tax_id AS taxId, c.email, c.phone, c.address,
      c.tax_condition AS taxCondition, c.price_list_id AS priceListId,
      c.status, c.notes, c.created_at AS createdAt,
      pl.name AS priceListName
    FROM customers c
    JOIN price_lists pl ON pl.id = c.price_list_id
    WHERE c.id = ? AND c.org_id = ? AND c.is_deleted = 0
    LIMIT 1
  `, [id, orgId]);
  return rows[0];
}

async function insertCustomer(data) {
  const {
    orgId,
    name, taxId, email, phone, address,
    taxCondition, priceListId, status, notes, createdBy
  } = data;

  const [res] = await pool.query(`
    INSERT INTO customers
      (org_id, name, tax_id, email, phone, address, tax_condition, price_list_id, status, notes, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
  `, [orgId, name, taxId || null, email || null, phone || null, address || null,
      taxCondition, priceListId, status, notes || null, createdBy]);

  const customerId = res.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR CLIENTE ---
  logAction({
    orgId: orgId,
    userId: createdBy,
    actionType: 'CREATE',
    entityType: 'CUSTOMER',
    entityId: customerId,
    details: { name: name, taxId: taxId || null, email: email || null }
  });
  // --- FIN AUDITORÍA ---

  return customerId;
}

async function updateCustomerById(id, data, orgId) {
  const fields = [];
  const params = [];
  const allowed = ['name','taxId','email','phone','address','taxCondition','priceListId','status','notes','lastPurchaseAt','updatedBy'];

  const map = {
    taxId: 'tax_id',
    taxCondition: 'tax_condition',
    priceListId: 'price_list_id',
    lastPurchaseAt: 'last_purchase_at',
    updatedBy: 'updated_by'
  };

  for (const k of allowed) {
    if (data[k] !== undefined) {
      const col = map[k] || k;
      fields.push(`${col} = ?`);
      params.push(data[k]);
    }
  }

  if (!fields.length) return 0;

  // Remover 'updatedBy' de la consulta SQL pero mantenerlo para la auditoría
  const updatedBy = data.updatedBy;
  const updateFields = fields.filter(f => !f.startsWith('updated_by'));
  const updateParams = params.filter((p, i) => !fields[i].startsWith('updated_by'));

  if (!updateFields.length) return 0; // Solo se pasó updatedBy, nada que actualizar en DB

  const sql = `
    UPDATE customers
    SET ${updateFields.join(', ')}, updated_at = NOW(), updated_by = ?
    WHERE id = ? AND org_id = ? AND is_deleted = 0
  `;
  const [result] = await pool.query(sql, [...updateParams, updatedBy, id, orgId]);

  if (result.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ACTUALIZAR CLIENTE ---
    logAction({
      orgId: orgId,
      userId: updatedBy,
      actionType: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: id,
      details: { updatedFields: updateFields.map(f => f.split(' =')[0]) } // Solo nombres de campos
    });
    // --- FIN AUDITORÍA ---
  }
  return result.affectedRows;
}

async function softDeleteCustomerById(id, userId, orgId) {
  const [result] = await pool.query(
    `UPDATE customers
     SET deleted_at = NOW(), updated_by = ?, is_deleted = 1
     WHERE id = ? AND org_id = ? AND is_deleted = 0`,
    [userId || null, id, orgId]
  );

  if (result.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ELIMINAR CLIENTE ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'DELETE',
      entityType: 'CUSTOMER',
      entityId: id
    });
    // --- FIN AUDITORÍA ---
  }
  return result.affectedRows;
}

async function upsertTagsForCustomer(customerId, orgId, tagNames, conn = null) {
  // ... (Tu código existente aquí - sin cambios) ...
  // Esta función es llamada por create/update, que ya están auditados.
  // Auditar esto por separado podría ser redundante, a menos que tengas un endpoint solo para tags.
  const connection = conn || await pool.getConnection();
  const release = !conn;
  try {
    if (!conn) await connection.beginTransaction();
    const names = (tagNames || []).map(n => String(n).trim()).filter(Boolean);
    let tagIds = [];
    if (names.length) {
      const placeholders = names.map(() => '(?, ?)').join(',');
      const insertSql = `INSERT INTO tags (org_id, name) VALUES ${placeholders} ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`;
      await connection.query(insertSql, names.flatMap(n => [orgId, n]));
      const [tagRows] = await connection.query(
        `SELECT id FROM tags WHERE org_id = ? AND name IN (?) AND is_deleted = 0`,
        [orgId, names]
      );
      tagIds = tagRows.map(r => r.id);
    }
    const [cust] = await connection.query('SELECT id FROM customers WHERE id = ? AND org_id = ? AND is_deleted = 0', [customerId, orgId]);
    if (!cust.length) {
      throw new Error('CUSTOMER_FORBIDDEN: Cliente no encontrado o no pertenece a la organización.');
    }
    await connection.query(`UPDATE customer_tags SET is_deleted = 1, deleted_at = NOW() WHERE customer_id = ? AND is_deleted = 0`, [customerId]);
    if (tagIds.length) {
      const ctPlaceholders = tagIds.map(() => '(?, ?)').join(',');
      const ctInsertSql = `INSERT INTO customer_tags (customer_id, tag_id) VALUES ${ctPlaceholders}`;
      await connection.query(ctInsertSql, tagIds.flatMap(tagId => [customerId, tagId]));
    }
    if (!conn) await connection.commit();
  } catch (e) {
    if (!conn) await connection.rollback();
    throw e;
  } finally {
    if (release) connection.release();
  }
}

async function getTagsByCustomer(customerId, orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [rows] = await pool.query(`
    SELECT t.name
    FROM customer_tags ct
    JOIN tags t ON t.id = ct.tag_id
    JOIN customers c ON c.id = ct.customer_id
    WHERE ct.customer_id = ? AND c.org_id = ? AND ct.is_deleted = 0 AND t.is_deleted = 0
  `, [customerId, orgId]);
  return rows.map(r => r.name);
}

async function getBalanceByCustomer(customerId, orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [rows] = await pool.query(`
    SELECT
      SUM(CASE type
        WHEN 'INVOICE' THEN amount
        WHEN 'CREDIT_NOTE' THEN -amount
        WHEN 'PAYMENT' THEN -amount
        WHEN 'ADJUSTMENT' THEN amount
      END) AS balance
    FROM ar_transactions t
    JOIN customers c ON c.id = t.customer_id
    WHERE t.customer_id = ? AND c.org_id = ? AND t.is_deleted = 0
  `, [customerId, orgId]);
  return Number(rows[0]?.balance || 0);
}

async function getStatementByCustomer(customerId, { from, to }, orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  const wh = ['t.customer_id = ?', 't.is_deleted = 0'];
  const params = [customerId];
  if (from) { wh.push('t.trx_date >= ?'); params.push(from); }
  if (to)   { wh.push('t.trx_date <  DATE_ADD(?, INTERVAL 1 DAY)'); params.push(to); }
  const [rows] = await pool.query(`
    SELECT t.id, t.trx_date AS date, t.type, t.amount, t.description
    FROM ar_transactions t
    JOIN customers c ON c.id = t.customer_id
    WHERE ${wh.join(' AND ')} AND c.org_id = ?
    ORDER BY t.trx_date ASC, t.id ASC
  `, [...params, orgId]);
  const balance = rows.reduce((acc, r) => {
    if (r.type === 'INVOICE' || r.type === 'ADJUSTMENT') acc += Number(r.amount);
    else acc -= Number(r.amount);
    return acc;
  }, 0);
  return { items: rows, balance };
}

async function upsertCustomerOnSale({ orgId, branchId, name = 'Consumidor Final', createdBy }, conn = null) {
    // ... (Tu código existente aquí - sin cambios) ...
    const connection = conn || pool;
    const DEFAULT_PRICE_LIST_ID = 1;
    const [existing] = await connection.query(
        `SELECT id FROM customers
         WHERE org_id = ? AND name = ? AND tax_condition = 'CF' AND is_deleted = 0
         LIMIT 1`,
        [orgId, name]
    );
    if (existing.length) {
        return existing[0].id;
    }
    const [res] = await connection.query(
      `INSERT INTO customers
        (org_id, branch_id, name, tax_condition, price_list_id, status, created_at, created_by)
      VALUES (?, ?, ?, 'CF', ?, 'ACTIVE', NOW(), ?)`,
      [orgId, branchId, name, DEFAULT_PRICE_LIST_ID, createdBy]
    );
    // Auditamos este cliente especial (Consumidor Final)
    logAction({
        orgId: orgId,
        userId: createdBy,
        actionType: 'CREATE',
        entityType: 'CUSTOMER',
        entityId: res.insertId,
        details: { name: name, context: 'Auto-created during sale/quote' }
    });
    return res.insertId;
}

// --- NUEVA FUNCIÓN DE IMPORTACIÓN CSV (CON AUDITORÍA) ---
async function processCustomerImport({ orgId, userId, customers }) {
  const conn = await pool.getConnection();
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  const priceListCache = new Map();
  try {
      const [pls] = await conn.query('SELECT id, name FROM price_lists WHERE org_id = ? AND is_deleted = 0', [orgId]);
      pls.forEach(pl => priceListCache.set(String(pl.name).trim().toLowerCase(), pl.id));
      if (priceListCache.size === 0) {
           const [newPL] = await conn.query("INSERT INTO price_lists (org_id, name, is_default) VALUES (?, 'General', 1)", [orgId]);
           priceListCache.set('general', newPL.insertId);
           console.log(`No se encontraron listas de precios. Se creó 'General' (ID: ${newPL.insertId}) para Org ${orgId}`);
      }
  } catch (e) {
       conn.release();
       return { successCount: 0, errorCount: customers.length, errors: [], globalError: `Error al precargar/crear listas de precios: ${e.message}` };
  }

  for (let i = 0; i < customers.length; i++) {
    const row = customers[i];
    const rowNumber = i + 2;

    await conn.beginTransaction();
    try {
      // ... (Validaciones de fila: required, priceList, taxCondition) ...
      const { name, taxCondition, priceListName } = row;
      if (!name || !taxCondition || !priceListName) { throw new Error('Faltan columnas requeridas: name, taxCondition, priceListName.'); }
      const priceListId = priceListCache.get(String(priceListName).trim().toLowerCase());
      if (!priceListId) { throw new Error(`Lista de precios '${priceListName}' no encontrada. Opciones: [${Array.from(priceListCache.keys()).join(', ')}]`); }
      const validTaxConditions = ['RI', 'MT', 'CF', 'EX'];
      const taxCondTrimmed = String(taxCondition).trim().toUpperCase();
      if (!validTaxConditions.includes(taxCondTrimmed)) { throw new Error(`taxCondition '${taxCondition}' inválida. Usar: ${validTaxConditions.join(', ')}`); }

      // 4. Insertar Cliente
      let customerId;
      try {
        const [res] = await conn.query(`
          INSERT INTO customers
            (org_id, name, tax_id, email, phone, address, tax_condition, price_list_id, status, notes, created_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `, [
            orgId, String(name).trim(), row.taxId ? String(row.taxId).trim() : null,
            row.email ? String(row.email).trim() : null, row.phone ? String(row.phone).trim() : null,
            row.address ? String(row.address).trim() : null, taxCondTrimmed, priceListId,
            (row.status && ['ACTIVE', 'BLOCKED'].includes(String(row.status).trim().toUpperCase())) ? String(row.status).trim().toUpperCase() : 'ACTIVE',
            row.notes ? String(row.notes).trim() : null, userId
        ]);
        customerId = res.insertId;
      } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') { throw new Error(`Cliente duplicado (taxId/email?): ${err.message}`); }
          throw err;
      }

      // 5. Procesar Tags (separados por |)
      const tags = row.tags ? String(row.tags).split('|').map(t => t.trim()).filter(Boolean) : [];
      if (tags.length > 0) {
        await upsertTagsForCustomer(customerId, orgId, tags, conn);
      }

      await conn.commit();
      successCount++;
      // No auditamos CADA fila, auditaremos el lote al final

    } catch (rowError) {
      await conn.rollback();
      errorCount++;
      errors.push({ row: rowNumber, message: rowError.message, data: row });
      console.error(`[IMPORT CUSTOMER ROW ${rowNumber}] Error: ${rowError.message}`);
    }
  } // Fin del bucle

  // --- PUNTO DE AUDITORÍA: IMPORTAR CLIENTES ---
  logAction({
    orgId: orgId,
    userId: userId,
    actionType: 'IMPORT_CUSTOMERS',
    entityType: 'CUSTOMER',
    details: {
      successCount: successCount,
      errorCount: errorCount,
      errors: errors // Guardar los errores de fila
    }
  });
  // --- FIN AUDITORÍA ---

  conn.release();
  return { successCount, errorCount, errors };
}


// --- Asegúrate de exportar todo ---
module.exports = {
  queryCustomers,
  countCustomers,
  getCustomer,
  insertCustomer,
  updateCustomerById,
  upsertCustomerOnSale,
  softDeleteCustomerById,
  upsertTagsForCustomer,
  getTagsByCustomer,
  getBalanceByCustomer,
  getStatementByCustomer,
  processCustomerImport
};
