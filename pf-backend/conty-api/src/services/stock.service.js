// src/services/stock.service.js
const pool = require('../config/db');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

/* =====================================================================
 * Helpers Internos
 * ===================================================================== */

function like(s) { return `%${s}%`; }

/**
 * Aplica delta de stock sobre branch_variant_stock (asegura fila).
 */
async function applyStockDelta(branchId, variantId, delta, unit_cost = null, conn) {
  const c = conn || (await pool.getConnection());
  const release = !conn;
  try {
    // Una sola consulta UPSERT que suma el delta
    await c.query(`
      INSERT INTO branch_variant_stock (branch_id, variant_id, qty, min_qty)
      VALUES (?, ?, ?, 0)
      ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)
    `, [branchId, variantId, delta]);

  } catch (e) {
      console.error(`Error en applyStockDelta [Branch: ${branchId}, Variant: ${variantId}, Delta: ${delta}]:`, e.message);
      throw e; // Relanzar el error
  } finally {
    if (release) c.release();
  }
}

/**
 * Verifica que una lista de variantes pertenezca a la orgId.
 */
async function validateVariantsOrg(variantIds, orgId, conn) {
  if (!Array.isArray(variantIds) || !variantIds.length) {
    throw new Error('ITEMS_REQUIRED: El array de ítems no puede estar vacío.');
  }
  const uniqueVariantIds = [...new Set(variantIds.map(Number))];
  if (uniqueVariantIds.some(isNaN)) {
      throw new Error('INVALID_VARIANT_ID: Uno o más IDs de variante no son válidos.');
  }
  if (!uniqueVariantIds.length) {
      throw new Error('ITEMS_REQUIRED: El array de ítems no contiene variantes válidas.');
  }
  const placeholders = uniqueVariantIds.map(() => '?').join(',');

  const [rows] = await conn.query(
    `SELECT pv.id
     FROM product_variants pv
     JOIN products p ON p.id = pv.product_id
     WHERE p.org_id = ? AND pv.id IN (${placeholders}) AND pv.is_deleted = 0 AND p.is_deleted = 0`,
    [orgId, ...uniqueVariantIds]
  );

  if (rows.length !== uniqueVariantIds.length) {
    const foundIds = new Set(rows.map(r => r.id));
    const missing = uniqueVariantIds.filter(id => !foundIds.has(id));
    throw new Error(`FORBIDDEN_OR_NOT_FOUND: Las siguientes variantes no pertenecen a la organización o no existen: ${missing.join(', ')}`);
  }
}


/* =====================================================================
 * Overview (visión general)
 * ===================================================================== */
async function getStockOverview({ orgId, branchId = null, noMovementDays = 90 }) {
  // ... (Tu código existente aquí - sin cambios) ...
  // 1) Stock bajo (vista v_stock_bajo)
  const [lowRows] = await pool.query(
    `SELECT COUNT(DISTINCT bvs.variant_id) AS lowCount
     FROM v_stock_bajo b
     JOIN branch_variant_stock bvs ON bvs.branch_id = b.branch_id AND bvs.variant_id = b.variant_id
     JOIN product_variants pv ON pv.id = bvs.variant_id AND pv.is_deleted = 0
     JOIN products p ON p.id = pv.product_id AND p.is_deleted = 0 AND p.org_id = ?
     ${branchId ? 'WHERE b.branch_id = ?' : ''}`,
    branchId ? [orgId, branchId] : [orgId]
  );
  const lowStock = Number(lowRows[0]?.lowCount || 0);

  // 2) Valor de inventario (vista v_inventory_value)
  const [valRows] = await pool.query(
    `SELECT SUM(inventory_value) AS totalValue
     FROM v_inventory_value
     WHERE org_id = ? ${branchId ? 'AND branch_id = ?' : ''}`,
    branchId ? [orgId, branchId] : [orgId]
  );
  const inventoryValue = Number(valRows[0]?.totalValue || 0);

  // 3) Sin movimiento N días
  const [nmRows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM (
       SELECT pv.id
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id AND p.org_id = ? AND p.is_deleted = 0
       WHERE pv.is_deleted = 0
       AND NOT EXISTS (
         SELECT 1 FROM stock_movement_items smi
         JOIN stock_movements sm ON sm.id = smi.movement_id AND sm.is_deleted = 0
         WHERE smi.variant_id = pv.id
           ${branchId ? 'AND sm.branch_id = ?' : ''}
           AND sm.created_at >= (NOW() - INTERVAL ? DAY)
           AND smi.is_deleted = 0
       )
     ) x`,
    branchId ? [orgId, branchId, noMovementDays] : [orgId, noMovementDays]
  );
  const noMovement = Number(nmRows[0]?.cnt || 0);

  return { lowStock, inventoryValue, noMovement, noMovementDays };
}

/* =====================================================================
 * Movements
 * ===================================================================== */

async function listMovements(filters, { limit = 50, offset = 0 }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const params = [filters.orgId];
  const wh = [`sm.is_deleted = 0`, `p.org_id = ?`];

  if (filters.from) { wh.push(`sm.created_at >= ?`); params.push(filters.from); }
  if (filters.to) { wh.push(`sm.created_at < DATE_ADD(?, INTERVAL 1 DAY)`); params.push(filters.to); }
  if (filters.type) { wh.push(`sm.type = ?`); params.push(filters.type); }
  if (filters.branchId) { wh.push(`sm.branch_id = ?`); params.push(filters.branchId); }
  if (filters.q) {
    wh.push(`(p.name LIKE ? OR p.sku LIKE ? OR pv.sku LIKE ?)`);
    params.push(like(filters.q), like(filters.q), like(filters.q));
  }

  const sql = `
    SELECT
      sm.id, sm.type, sm.branch_id AS branchId, sm.ref_code AS refCode, sm.note, sm.created_at AS createdAt,
      b.name AS branchName, u.name AS userName, smi.variant_id AS variantId,
      COALESCE(pv.name, '') AS variantName, p.id AS productId, p.name AS productName,
      p.sku AS productSku, smi.quantity
    FROM stock_movements sm
    JOIN stock_movement_items smi ON smi.movement_id = sm.id AND smi.is_deleted = 0
    JOIN branches b ON b.id = sm.branch_id
    LEFT JOIN users u ON u.id = sm.created_by
    JOIN product_variants pv ON pv.id = smi.variant_id
    JOIN products p ON p.id = pv.product_id
    WHERE ${wh.join(' AND ')}
    ORDER BY sm.created_at DESC, sm.id DESC
    LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(sql, [...params, limit, offset]);

  const countSql = `
    SELECT COUNT(sm.id) AS total
    FROM stock_movements sm
    JOIN stock_movement_items smi ON smi.movement_id = sm.id AND smi.is_deleted = 0
    JOIN product_variants pv ON pv.id = smi.variant_id
    JOIN products p ON p.id = pv.product_id
    JOIN branches b ON b.id = sm.branch_id
    LEFT JOIN users u ON u.id = sm.created_by
    WHERE ${wh.join(' AND ')}`;
  const [cntRows] = await pool.query(countSql, params);

  return { items: rows, total: Number(cntRows[0]?.total || 0) };
}

/**
 * Crea un movimiento de stock (Auditoría añadida)
 */
async function createMovement({ orgId, branchId, type, ref_code, note, created_by, items }, conn = null) {
  const connection = conn || await pool.getConnection();
  const releaseConnection = !conn;
  let movementId; // Definir fuera para usar en auditoría

  try {
    if (!conn) await connection.beginTransaction();

    await validateVariantsOrg(items.map(it => it.variant_id), orgId, connection);

    const [mov] = await connection.query(`
      INSERT INTO stock_movements (org_id, branch_id, type, ref_code, note, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [orgId, branchId, type, ref_code || null, note || null, created_by || null]);
    movementId = mov.insertId;

    for (const it of items) {
      // ... (Lógica de delta y validación de stock insuficiente) ...
      const { variant_id, quantity, unit_cost = null } = it;
      let delta = Number(quantity);
      let isNegativeMovement = false;
      if (type === 'SALE' || type === 'TRANSFER_OUT' || (type === 'ADJUSTMENT' && delta < 0)) {
        if (type !== 'ADJUSTMENT') delta = -Math.abs(delta);
        isNegativeMovement = true;
      }
      if (isNegativeMovement) {
        const [stockRows] = await connection.query(
          `SELECT qty FROM branch_variant_stock WHERE branch_id = ? AND variant_id = ? FOR UPDATE`,
          [branchId, variant_id]
        );
        const currentQty = stockRows[0]?.qty ?? 0;
        if (currentQty + delta < 0) {
          throw new Error(`INSUFFICIENT_STOCK: Variante ID ${variant_id} solo tiene ${currentQty} unidades disponibles (se necesitan ${Math.abs(delta)}).`);
        }
      }
      await connection.query(`
        INSERT INTO stock_movement_items (movement_id, variant_id, quantity, unit_cost)
        VALUES (?, ?, ?, ?)
      `, [movementId, variant_id, delta, unit_cost]);
      await applyStockDelta(branchId, variant_id, delta, unit_cost, connection);
    }

    if (!conn) {
      await connection.commit(); // <-- TRANSACCIÓN EXITOSA (si no es parte de otra)
    }

    // --- PUNTO DE AUDITORÍA: CREAR MOVIMIENTO ---
    // Solo auditamos si NO es una Venta (SALE) o Transferencia (TRANSFER_*),
    // ya que esos se auditan en sus propios servicios (sales.service, etc.)
    // O si es llamado directamente (sin 'conn')
    if (!conn && (type === 'ENTRY' || type === 'ADJUSTMENT' || type === 'INVENTORY')) {
      logAction({
        orgId: orgId,
        userId: created_by,
        actionType: type, // Usamos el mismo tipo: 'ENTRY', 'ADJUSTMENT', 'INVENTORY'
        entityType: 'STOCK_MOVEMENT',
        entityId: movementId,
        details: {
          branchId: branchId,
          refCode: ref_code,
          itemsCount: items.length
        }
      });
    }
    // --- FIN AUDITORÍA ---

    return movementId;

  } catch (e) {
    if (!conn) await connection.rollback();
    throw e;
  } finally {
    if (releaseConnection) connection.release();
  }
}

async function createSingleMovement({
  orgId, branchId, type, variantId, quantity, ref_code = null, note = null, userId = null
}) {
  // Llama a createMovement que ya tiene la lógica de auditoría
  return createMovement({
    orgId,
    branchId,
    type,
    ref_code,
    note,
    created_by: userId,
    items: [{ variant_id: variantId, quantity }]
  });
}

/* =====================================================================
 * Transfers (Auditoría añadida)
 * ===================================================================== */

async function createTransfer({ orgId, userId, transfer_ref, originBranchId, destBranchId, items }) {
  const conn = await pool.getConnection();
  let outId, inId; // Para auditoría
  try {
    await conn.beginTransaction();

    await validateVariantsOrg(items.map(it => it.variant_id), orgId, conn);

    // OUT (Movimiento de salida)
    const [out] = await conn.query(`
      INSERT INTO stock_movements (org_id, branch_id, type, transfer_ref, created_by, created_at)
      VALUES (?, ?, 'TRANSFER_OUT', ?, ?, NOW())
    `, [orgId, originBranchId, transfer_ref, userId]);
    outId = out.insertId;

    for (const it of items) {
      // ... (Lógica de delta y validación de stock) ...
      const { variant_id, quantity } = it;
      const delta = -Math.abs(Number(quantity));
      const [stockRows] = await conn.query(
         `SELECT qty FROM branch_variant_stock WHERE branch_id = ? AND variant_id = ? FOR UPDATE`,
         [originBranchId, variant_id]
      );
      const currentQty = stockRows[0]?.qty ?? 0;
      if (currentQty + delta < 0) {
         throw new Error(`INSUFFICIENT_STOCK (Transfer): Variante ID ${variant_id} solo tiene ${currentQty} en origen (se necesitan ${Math.abs(delta)}).`);
      }
      await conn.query(`
        INSERT INTO stock_movement_items (movement_id, variant_id, quantity)
        VALUES (?, ?, ?)
      `, [outId, variant_id, delta]);
      await applyStockDelta(originBranchId, variant_id, delta, null, conn);
    }

    // IN (Movimiento de entrada)
    const [inn] = await conn.query(`
      INSERT INTO stock_movements (org_id, branch_id, type, transfer_ref, created_by, created_at)
      VALUES (?, ?, 'TRANSFER_IN', ?, ?, NOW())
    `, [orgId, destBranchId, transfer_ref, userId]);
    inId = inn.insertId;

    for (const it of items) {
      // ... (Lógica de delta positivo) ...
      const { variant_id, quantity } = it;
      const delta = Math.abs(Number(quantity));
      await conn.query(`
        INSERT INTO stock_movement_items (movement_id, variant_id, quantity)
        VALUES (?, ?, ?)
      `, [inId, variant_id, delta]);
      await applyStockDelta(destBranchId, variant_id, delta, null, conn);
    }

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: CREAR TRANSFERENCIA (ambos movimientos) ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'TRANSFER_OUT', // Auditar la salida
      entityType: 'STOCK_MOVEMENT',
      entityId: outId,
      details: { ref: transfer_ref, fromBranch: originBranchId, toBranch: destBranchId, itemsCount: items.length }
    });
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'TRANSFER_IN', // Auditar la entrada
      entityType: 'STOCK_MOVEMENT',
      entityId: inId,
      details: { ref: transfer_ref, fromBranch: originBranchId, toBranch: destBranchId, itemsCount: items.length }
    });
    // --- FIN AUDITORÍA ---

    return { transfer_ref, out_id: outId, in_id: inId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function createTransferOUT({ orgId, originBranchId, destBranchId, transfer_ref = null, userId = null, items = [], note = null }) {
  const conn = await pool.getConnection();
  let outId; // Para auditoría
  try {
    await conn.beginTransaction();

    await validateVariantsOrg(items.map(it => it.variant_id), orgId, conn);

    const [mov] = await conn.query(
      `INSERT INTO stock_movements (org_id, branch_id, type, transfer_ref, note, created_by, created_at)
       VALUES (?, ?, 'TRANSFER_OUT', ?, ?, ?, NOW())`,
      [orgId, originBranchId, transfer_ref, note, userId]
    );
    outId = mov.insertId;

    for (const it of items) {
      // ... (Lógica de delta y validación de stock) ...
      const variant_id = Number(it.variant_id);
      const delta = -Math.abs(Number(it.quantity));
      const [stockRows] = await conn.query(
         `SELECT qty FROM branch_variant_stock WHERE branch_id = ? AND variant_id = ? FOR UPDATE`,
         [originBranchId, variant_id]
      );
      const currentQty = stockRows[0]?.qty ?? 0;
      if (currentQty + delta < 0) {
         throw new Error(`INSUFFICIENT_STOCK (Transfer OUT): Variante ID ${variant_id} solo tiene ${currentQty} en origen (se necesitan ${Math.abs(delta)}).`);
      }
      await conn.query(
        `INSERT INTO stock_movement_items (movement_id, variant_id, quantity)
         VALUES (?, ?, ?)`,
        [outId, variant_id, delta]
      );
      await applyStockDelta(originBranchId, variant_id, delta, null, conn);
    }

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: CREAR TRANSFERENCIA (Solo Salida) ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'TRANSFER_OUT',
      entityType: 'STOCK_MOVEMENT',
      entityId: outId,
      details: { ref: transfer_ref, fromBranch: originBranchId, toBranch: destBranchId, itemsCount: items.length, note: note }
    });
    // --- FIN AUDITORÍA ---

    return { transfer_ref, out_id: outId, destBranchId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function receiveTransferIN({ orgId, transfer_ref, destBranchId = null, userId = null }) {
  const conn = await pool.getConnection();
  let inId; // Para auditoría
  try {
    await conn.beginTransaction();

    // ... (Lógica de buscar OUT, chequear 'already', validar branch) ...
    const [outs] = await conn.query(/* ... */);
    const out = outs[0];
    if (!out) throw new Error('TRANSFER_OUT_NOT_FOUND: ...');
    const [already] = await conn.query(/* ... */);
    if (already.length) {
      await conn.rollback();
      return { alreadyReceived: true, in_id: already[0].id };
    }
    if (!destBranchId) throw new Error('DEST_BRANCH_REQUIRED: ...');
    const [branchCheck] = await conn.query('SELECT 1 FROM branches WHERE id = ? AND org_id = ? AND is_deleted = 0', [destBranchId, orgId]);
    if (!branchCheck.length) {
        throw new Error('FORBIDDEN_BRANCH: ...');
    }
    const [items] = await conn.query(
      `SELECT variant_id, ABS(quantity) AS qty
       FROM stock_movement_items WHERE movement_id = ? AND is_deleted = 0`,
      [out.id]
    );
    if (!items.length) {
        // ... (Manejo de items vacíos) ...
        const [emptyIn] = await conn.query(/* ... */);
        await conn.commit();
        // --- AUDITORÍA (Entrada vacía) ---
        logAction({
          orgId: orgId, userId: userId, actionType: 'RECEIVE_TRANSFER',
          entityType: 'STOCK_MOVEMENT', entityId: emptyIn.insertId,
          details: { ref: transfer_ref, fromBranch: out.originBranchId, toBranch: destBranchId, itemsCount: 0, note: "Recepción de transferencia vacía" }
        });
        // --- FIN AUDITORÍA ---
        return { transfer_ref, in_id: emptyIn.insertId, items: 0 };
    }

    // Crea el movimiento de ENTRADA (IN)
    const [inn] = await conn.query(
      `INSERT INTO stock_movements (org_id, branch_id, type, transfer_ref, created_by, created_at)
       VALUES (?, ?, 'TRANSFER_IN', ?, ?, NOW())`,
      [orgId, destBranchId, transfer_ref, userId]
    );
    inId = inn.insertId;

    for (const it of items) {
      // ... (Lógica de aplicar delta positivo) ...
      const delta = Number(it.qty);
      await conn.query(
        `INSERT INTO stock_movement_items (movement_id, variant_id, quantity)
         VALUES (?, ?, ?)`,
        [inId, it.variant_id, delta]
      );
      await applyStockDelta(destBranchId, it.variant_id, delta, null, conn);
    }

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: RECIBIR TRANSFERENCIA (Entrada) ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'RECEIVE_TRANSFER',
      entityType: 'STOCK_MOVEMENT',
      entityId: inId,
      details: { ref: transfer_ref, fromBranch: out.originBranchId, toBranch: destBranchId, itemsCount: items.length }
    });
    // --- FIN AUDITORÍA ---

    return { transfer_ref, in_id: inId, items: items.length };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function listTransfers({ orgId, branchId = null }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const params = [orgId];
  const wh = [`sm.org_id = ?`, `sm.is_deleted = 0`, `sm.transfer_ref IS NOT NULL`];
  if (branchId) {
      wh.push(`(sm.branch_id = ? OR EXISTS (SELECT 1 FROM stock_movements sm2 WHERE sm2.transfer_ref = sm.transfer_ref AND sm2.branch_id = ? AND sm2.type='TRANSFER_IN'))`);
      params.push(branchId, branchId);
  }
  const [rows] = await pool.query(
    `SELECT
      sm.transfer_ref AS ref,
      MIN(CASE WHEN sm.type='TRANSFER_OUT' THEN sm.id END) AS outId,
      MAX(CASE WHEN sm.type='TRANSFER_IN'  THEN sm.id END) AS inId,
      MAX(CASE WHEN sm.type='TRANSFER_OUT' THEN b.name END) AS originName,
      MAX(CASE WHEN sm.type='TRANSFER_IN'  THEN b2.name END) AS destName,
      MAX(sm.created_at) AS lastDate,
      (SELECT COUNT(DISTINCT smi_out.variant_id)
       FROM stock_movement_items smi_out
       WHERE smi_out.movement_id = MIN(CASE WHEN sm.type='TRANSFER_OUT' THEN sm.id END) AND smi_out.is_deleted = 0
      ) AS items
    FROM stock_movements sm
    LEFT JOIN branches b ON b.id = sm.branch_id
    LEFT JOIN stock_movements sm_in ON sm_in.transfer_ref = sm.transfer_ref AND sm_in.type='TRANSFER_IN' AND sm_in.org_id = sm.org_id AND sm_in.is_deleted = 0
    LEFT JOIN branches b2 ON b2.id = sm_in.branch_id
    WHERE ${wh.join(' AND ')}
    GROUP BY sm.transfer_ref
    ORDER BY lastDate DESC`,
    params
  );
  return rows.map(r => ({
    ref: r.ref,
    status: r.inId ? 'RECEIVED' : 'IN_TRANSIT',
    outId: r.outId,
    inId: r.inId || null,
    originName: r.originName || null,
    destName: r.destName || null,
    items: Number(r.items || 0),
    lastDate: r.lastDate
  }));
}


/* =====================================================================
 * Inventory sessions (Auditoría añadida y Seguridad TODOs)
 * ===================================================================== */

async function createInventorySession({ orgId, branchId, onlyDifferences = 0, userId = null }) {
  // ... (Tu código existente aquí - sin cambios, ya es seguro) ...
  const conn = await pool.getConnection();
  let sessionId; // Para auditoría
  try {
    await conn.beginTransaction();

    const [branchCheck] = await conn.query('SELECT 1 FROM branches WHERE id = ? AND org_id = ? AND is_deleted = 0', [branchId, orgId]);
    if (!branchCheck.length) {
        throw new Error('FORBIDDEN_BRANCH: La sucursal no existe o no pertenece a esta organización.');
    }

    const [ins] = await conn.query(
      `INSERT INTO inventory_sessions (org_id, branch_id, status, only_differences, created_by, created_at)
       VALUES (?, ?, 'OPEN', ?, ?, NOW())`,
      [orgId, branchId, onlyDifferences ? 1 : 0, userId]
    );
    sessionId = ins.insertId;

    const [stockRows] = await conn.query(
      `SELECT bvs.variant_id, bvs.qty AS expected
       FROM branch_variant_stock bvs
       JOIN product_variants pv ON pv.id = bvs.variant_id AND pv.is_deleted = 0
       JOIN products p ON p.id = pv.product_id AND p.org_id = ? AND p.is_deleted = 0
       WHERE bvs.branch_id = ?`,
      [orgId, branchId]
    );

    if (stockRows.length) {
      const values = stockRows.map(() => '(?, ?, ?, 0, 0)').join(',');
      const params = [];
      stockRows.forEach(r => params.push(sessionId, r.variant_id, r.expected));
      await conn.query(
        `INSERT INTO inventory_session_items (session_id, variant_id, expected_qty, counted_qty, difference)
         VALUES ${values}`,
        params
      );
    }

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: CREAR SESIÓN DE INVENTARIO ---
    logAction({
        orgId: orgId,
        userId: userId,
        actionType: 'CREATE',
        entityType: 'INVENTORY_SESSION',
        entityId: sessionId,
        details: { branchId: branchId, itemsPrefilled: stockRows.length }
    });
    // --- FIN AUDITORÍA ---

    return sessionId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function listInventorySessions({ orgId, branchId = null, status = null }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const params = [orgId];
  const wh = [`isv.org_id = ?`, `isv.is_deleted = 0`];
  if (branchId) { wh.push(`isv.branch_id = ?`); params.push(branchId); }
  if (status) { wh.push(`isv.status = ?`); params.push(status); }

  const [rows] = await pool.query(
    `SELECT isv.id, isv.branch_id AS branchId, b.name AS branchName, isv.status,
            isv.only_differences AS onlyDifferences, isv.created_at AS createdAt
     FROM inventory_sessions isv
     JOIN branches b ON b.id = isv.branch_id
     WHERE ${wh.join(' AND ')}
     ORDER BY isv.id DESC`,
    params
  );
  return rows;
}

/**
 * Obtener sesión con ítems.
 * ¡PELIGRO! No valida orgId. Asume que el controlador lo hizo.
 * CORREGIDO: Añadir validación de orgId.
 */
async function getInventorySession(sessionId, orgId) {
  const [hdrs] = await pool.query(
    `SELECT isv.*, b.name AS branchName
     FROM inventory_sessions isv
     JOIN branches b ON b.id = isv.branch_id
     WHERE isv.id = ? AND isv.is_deleted = 0
     LIMIT 1`,
    [sessionId]
  );
  const header = hdrs[0];
  if (!header) return null;
  // --- VALIDACIÓN DE SEGURIDAD AÑADIDA ---
  if (header.org_id !== orgId) {
      throw new Error('FORBIDDEN: La sesión de inventario no pertenece a esta organización.');
  }
  // --- FIN VALIDACIÓN ---

  const [items] = await pool.query(
    `SELECT isi.id, isi.variant_id AS variantId, isi.expected_qty AS expectedQty,
            isi.counted_qty AS countedQty, isi.difference,
            p.name AS productName, p.sku AS productSku,
            COALESCE(pv.name,'') AS variantName
     FROM inventory_session_items isi
     JOIN product_variants pv ON pv.id = isi.variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE isi.session_id = ? AND isi.is_deleted = 0
     ORDER BY p.name ASC, pv.id ASC`,
    [sessionId]
  );

  return { ...header, items };
}

/**
 * Cargar conteo para una variante en una sesión.
 * ¡PELIGRO! No valida orgId. Asume que el controlador lo hizo.
 * CORREGIDO: Añadir validación de orgId.
 */
async function countInventoryItem(sessionId, variantId, countedQty, orgId) {
  // --- VALIDACIÓN DE SEGURIDAD AÑADIDA ---
  // Validar que la sesión (sessionId) pertenece a la orgId antes de actualizar
  const [sessionCheck] = await pool.query(
      'SELECT 1 FROM inventory_sessions WHERE id = ? AND org_id = ? AND is_deleted = 0 AND status = \'OPEN\'',
      [sessionId, orgId]
  );
  if (!sessionCheck.length) {
      throw new Error('FORBIDDEN_OR_NOT_OPEN: Sesión no encontrada, no pertenece a la org, o no está abierta.');
  }
  // --- FIN VALIDACIÓN ---

  await pool.query(
    `UPDATE inventory_session_items
     SET counted_qty = ?, difference = (? - expected_qty)
     WHERE session_id = ? AND variant_id = ? AND is_deleted = 0`,
    [countedQty, countedQty, sessionId, variantId]
  );
  // NOTA: Esta acción es muy granular, auditarla puede llenar el log.
  // Es mejor auditar solo la APROBACIÓN.
}

/**
 * Aprobar inventario y aplicar diferencias. (Auditoría añadida)
 * CORREGIDO: Añadir validación de orgId.
 */
async function approveInventorySession(sessionId, approvedBy, orgId) {
  const conn = await pool.getConnection();
  let movId = null; // Para auditoría
  try {
    await conn.beginTransaction();

    // Obtener datos de la sesión y bloquearla
    const [hdrs] = await conn.query(
      `SELECT id, org_id, branch_id, status FROM inventory_sessions
       WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
      [sessionId]
    );
    const h = hdrs[0];
    if (!h) throw new Error('NOT_FOUND: Sesión de inventario no encontrada.');

    // --- VALIDACIÓN DE SEGURIDAD AÑADIDA ---
    if (h.org_id !== orgId) {
        await conn.rollback(); // Liberar el lock
        throw new Error('FORBIDDEN: La sesión de inventario no pertenece a esta organización.');
    }
    // --- FIN VALIDACIÓN ---

    if (h.status !== 'OPEN') throw new Error('INVALID_STATUS: La sesión no está abierta.');

    const [diffs] = await conn.query(
      `SELECT variant_id, difference FROM inventory_session_items
       WHERE session_id = ? AND is_deleted = 0 AND difference <> 0`,
      [sessionId]
    );

    if (diffs.length) {
      // Crear movimiento INVENTORY
      const [ins] = await conn.query(
        `INSERT INTO stock_movements (org_id, branch_id, type, created_by, created_at, ref_code, note)
         VALUES (?, ?, 'INVENTORY', ?, NOW(), ?, ?)`,
        [h.org_id, h.branch_id, approvedBy, `INV-${sessionId}`, 'Ajuste por inventario']
      );
      movId = ins.insertId;

      for (const d of diffs) {
        const delta = Number(d.difference);
        await conn.query(
          `INSERT INTO stock_movement_items (movement_id, variant_id, quantity)
           VALUES (?, ?, ?)`,
          [movId, d.variant_id, delta]
        );
        await applyStockDelta(h.branch_id, d.variant_id, delta, null, conn);
      }
    }

    await conn.query(
      `UPDATE inventory_sessions
       SET status = 'APPROVED', approved_by = ?, approved_at = NOW()
       WHERE id = ?`,
      [approvedBy || null, sessionId]
    );

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: APROBAR INVENTARIO ---
    logAction({
      orgId: orgId,
      userId: approvedBy,
      actionType: 'APPROVE_INVENTORY',
      entityType: 'INVENTORY_SESSION',
      entityId: sessionId,
      details: { branchId: h.branch_id, differencesFound: diffs.length, stockMovementId: movId }
    });
    // --- FIN AUDITORÍA ---

    return { ok: true, movementId: movId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Cancelar inventario.
 * CORREGIDO: Añadir validación de orgId.
 */
async function cancelInventorySession(sessionId, userId, orgId) {
  // --- VALIDACIÓN DE SEGURIDAD AÑADIDA ---
  const [result] = await pool.query(
    `UPDATE inventory_sessions
     SET status = 'CANCELLED', approved_by = ?, approved_at = NOW()
     WHERE id = ? AND org_id = ? AND is_deleted = 0 AND status = 'OPEN'`,
    [userId || null, sessionId, orgId]
  );
  // --- FIN VALIDACIÓN ---

  if (result.affectedRows > 0) {
      // --- PUNTO DE AUDITORÍA: CANCELAR INVENTARIO ---
      logAction({
          orgId: orgId,
          userId: userId,
          actionType: 'DELETE', // O 'CANCEL' si lo añades al ENUM
          entityType: 'INVENTORY_SESSION',
          entityId: sessionId,
          details: { reason: 'Cancelado por usuario' }
      });
      // --- FIN AUDITORÍA ---
  }
  // Si no afectó filas, es porque no existía, no pertenecía a la org, o no estaba 'OPEN'
}

/* =====================================================================
 * Product search for modals - Función Segura
 * ===================================================================== */
async function searchProductsForStock({ orgId, branchId = null, q = '' }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const params = [];
  const wh = [];

  let stockJoin = 'LEFT JOIN branch_variant_stock bvs ON bvs.variant_id = pv.id';
  if (branchId) {
    stockJoin += ' AND bvs.branch_id = ?';
    params.push(branchId);
  }

  wh.push(`p.org_id = ?`);
  params.push(orgId);
  wh.push(`p.is_deleted = 0`);
  wh.push(`(pv.is_deleted = 0 OR pv.id IS NULL)`);

  if (q) {
    wh.push(`(p.name LIKE ? OR p.sku LIKE ? OR pv.sku LIKE ? OR pv.barcode LIKE ?)`);
    const s = like(q);
    params.push(s, s, s, s);
  }

  const [rows] = await pool.query(
    `SELECT
      p.id AS productId, p.name AS productName, p.sku AS productSku,
      pv.id AS variantId, COALESCE(pv.name,'') AS variantName,
      COALESCE(pv.sku, p.sku) AS variantSku,
      COALESCE(pv.price, p.price, 0) AS price,
      COALESCE(bvs.qty, 0) AS qty
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    ${stockJoin}
    WHERE ${wh.join(' AND ')}
    ORDER BY p.name ASC, pv.id ASC`,
    params
  );

  return rows;
}

/* =====================================================================
 * Exports
 * ===================================================================== */
module.exports = {
  // helpers
  applyStockDelta,
  validateVariantsOrg,

  // overview
  getStockOverview,

  // movements
  listMovements,
  createMovement,
  createSingleMovement,

  // transfers
  createTransfer,
  createTransferOUT,
  receiveTransferIN,
  listTransfers,

  // inventory (Corregido para validar orgId)
  createInventorySession,
  listInventorySessions,
  getInventorySession,
  countInventoryItem,
  approveInventorySession,
  cancelInventorySession,

  // product search
  searchProductsForStock,
};
