// src/services/sales.service.js
const pool = require('../config/db');
const numbering = require('./numbering.service');
const stock = require('./stock.service');
const { upsertCustomerOnSale, getCustomer } = require('./customer.service');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

/**
 * Lista ventas con filtros básicos
 */
async function listSales({ orgId, branchId, from, to, status, search, limit = 50, offset = 0 }) {
  const wh = ['s.is_deleted = 0', 's.org_id = ?'];
  const params = [orgId];
  if (branchId) { wh.push('s.branch_id = ?'); params.push(branchId); }
  if (status) { wh.push('s.status = ?'); params.push(status); }
  if (from) { wh.push('s.created_at >= ?'); params.push(from); }
  if (to) { wh.push('s.created_at < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(to); }
  if (search) {
    wh.push('(s.doc_number LIKE ? OR c.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await pool.query(
    `SELECT s.id, s.doc_type AS docType, s.doc_number AS docText, s.doc_number AS docNumber,
            s.branch_id AS branchId, b.name AS branchName, s.customer_id AS customerId,
            c.name AS customerName, s.total_amount AS total, s.status, s.created_at AS createdAt
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id AND c.is_deleted = 0
       LEFT JOIN branches  b ON b.id = s.branch_id AND b.is_deleted = 0
      WHERE ${wh.join(' AND ')}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows.map(r => ({...r, total: parseFloat(r.total)}));
}

async function getSale(id, orgId) {
  // 1. Obtener cabecera
  const [hdr] = await pool.query(
    `SELECT s.*, b.name AS branchName, c.name AS customerName, u.name AS userName
       FROM sales s
       LEFT JOIN branches b ON b.id = s.branch_id AND b.is_deleted = 0
       LEFT JOIN customers c ON c.id = s.customer_id AND c.is_deleted = 0
       LEFT JOIN users u ON u.id = s.seller_id AND u.is_deleted = 0
      WHERE s.id = ? AND s.org_id = ? AND s.is_deleted = 0
      LIMIT 1`,
    [id, orgId]
  );
  const sale = hdr[0];
  if (!sale) return null;

  // 2. Obtener ítems
  const [items] = await pool.query(
    `SELECT i.id, i.variant_id AS variantId, i.qty, i.price_unit AS unitPrice, i.tax_pct AS vatPercent,
            i.discount_pct AS discountPercent, i.line_total AS total,
            (i.line_total / (1 + (i.tax_pct / 100))) AS subtotal,
            i.name_snapshot as nameSnapshot, i.sku_snapshot as skuSnapshot
       FROM sale_items i
      WHERE i.sale_id = ? AND i.is_deleted = 0
      ORDER BY i.id ASC`,
    [id]
  );

  // 3. Obtener pagos
  const [pays] = await pool.query(
    `SELECT sp.id, pm.name AS method, sp.amount, sp.details_json
       FROM sale_payments sp
       JOIN payment_methods pm ON pm.id = sp.method_id
      WHERE sp.sale_id = ? AND sp.is_deleted = 0
      ORDER BY sp.id ASC`,
    [id]
  );

  const paymentsFormatted = pays.map(p => {
      let note = null;
      if (p.details_json) {
          try {
              const details = JSON.parse(p.details_json);
              note = details.note || null;
          } catch (e) { console.warn(`Error parsing details_json for payment ${p.id}`); }
      }
      return { id: p.id, method: p.method, amount: parseFloat(p.amount), note };
  });

  return {
      ...sale,
      userName: sale.userName,
      docText: sale.doc_number || '',
      total: parseFloat(sale.total_amount),
      subtotal: parseFloat(sale.subtotal_amount),
      vat_total: parseFloat(sale.tax_amount),
      items: items.map(it => ({...it,
          nameSnapshot: it.nameSnapshot,
          skuSnapshot: it.skuSnapshot,
          unitPrice: parseFloat(it.unitPrice),
          total: parseFloat(it.total),
          subtotal: parseFloat(it.subtotal)
      })),
      payments: paymentsFormatted
  };
}

/**
 * Crear venta:
 * - (Auditoría añadida)
 */
async function createSale({
  orgId, branchId, posCode, docType, customerId, sellerId,
  items, payments = [], note, refCode
}) {
  const conn = await pool.getConnection();
  // Definir variables fuera del try para que estén disponibles en el log de auditoría
  let saleId;
  let finalCustomerId = customerId;
  let formatted;
  let number;
  let totalSaleAmount = 0;

  try {
    await conn.beginTransaction();

    // --- 1. LÓGICA: AUTO-CREAR CLIENTE O VALIDAR PERTENENCIA ---
    if (!customerId) {
        finalCustomerId = await upsertCustomerOnSale({
             orgId,
             branchId,
             createdBy: sellerId || null
        }, conn); // <-- Pasar 'conn' para la transacción

        if (!finalCustomerId) {
            throw new Error('CUSTOMER_CREATION_FAILED: No se pudo crear el cliente Consumidor Final.');
        }
    } else {
        const existingCustomer = await getCustomer(customerId, orgId); // getCustomer usa el pool, no 'conn'
        if (!existingCustomer) {
            throw new Error('FORBIDDEN_CUSTOMER: El cliente no existe o no pertenece a esta organización.');
        }
    }
    // --- FIN LÓGICA ---

    // 2) numeración
    const numData = await numbering.reserveNextNumber(conn, { orgId, docType, posCode });
    formatted = numData.formatted;
    number = numData.number;

    // 3) header
    const [ins] = await conn.query(
      `INSERT INTO sales (org_id, branch_id, doc_type, doc_number,
                          customer_id, seller_id, status, note, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, NOW(), ?)`,
      [orgId, branchId, docType, formatted, finalCustomerId, sellerId || null, note || null, sellerId || null]
    );
    saleId = ins.insertId;

    // 4) items
    let subtotalSaleAmount = 0;
    let taxSaleAmount = 0;
    const variantIds = items.map(it => it.variantId);
    if (!variantIds.length) { throw new Error('El array de ítems no puede estar vacío'); }
    const placeholders = variantIds.map(() => '?').join(',');
    const [variantDataRows] = await conn.query(
      `SELECT v.id, v.product_id, p.name AS product_name, v.sku, COALESCE(p.vat_percent, 0) as tax_pct
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.id IN (${placeholders}) AND p.org_id = ? AND v.is_deleted = 0 AND p.is_deleted = 0`,
      [...variantIds, orgId]
    );
    const variantDataMap = new Map(variantDataRows.map(v => [v.id, {
        productId: v.product_id,
        tax_pct: parseFloat(v.tax_pct),
        sku_snapshot: v.sku,
        name_snapshot: v.product_name
    }]));
     if (variantDataMap.size !== variantIds.length) {
       const missingIds = variantIds.filter(id => !variantDataMap.has(id));
       throw new Error(`FORBIDDEN_OR_NOT_FOUND: Una o más variantes no existen o no pertenecen a esta organización: ${missingIds.join(', ')}`);
     }
    for (const it of items) {
      // ... (cálculos de línea) ...
      const qty = Number(it.qty);
      const unit = Number(it.unitPrice);
      const disc = Number(it.discountPercent || 0);
      const variantInfo = variantDataMap.get(it.variantId);
      const productId = variantInfo.productId;
      const tax = variantInfo.tax_pct;
      const priceAfterDisc = unit * (1 - disc / 100);
      const lineSubtotal = priceAfterDisc * qty;
      const lineTax = lineSubtotal * (tax / 100);
      const lineTotal = lineSubtotal + lineTax;
      subtotalSaleAmount += lineSubtotal;
      taxSaleAmount += lineTax;

      await conn.query(
        `INSERT INTO sale_items (sale_id, product_id, variant_id, qty, price_unit, tax_pct, discount_pct, line_total, name_snapshot, sku_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [saleId, productId, it.variantId, qty, unit, tax, disc, lineTotal, variantInfo.name_snapshot, variantInfo.sku_snapshot]
      );
    }
    totalSaleAmount = subtotalSaleAmount + taxSaleAmount;

    // 5) payments
    if (payments && payments.length > 0) {
      const methodNames = payments.map(p => p.method);
      const methodPlaceholders = methodNames.map(() => '?').join(',');
      const [methodRows] = await conn.query(
        `SELECT id, name FROM payment_methods WHERE org_id = ? AND name IN (${methodPlaceholders}) AND is_deleted = 0`,
        [orgId, ...methodNames]
      );
      const methodMap = new Map(methodRows.map(m => [m.name, m.id]));
      for (const p of payments) {
        const methodId = methodMap.get(p.method);
        if (!methodId) {
          throw new Error(`Método de pago '${p.method}' no encontrado o no activo para esta organización.`);
        }
        const details = p.note ? { note: p.note } : null;
        await conn.query(
          `INSERT INTO sale_payments (sale_id, method_id, amount, details_json)
           VALUES (?, ?, ?, ?)`,
          [saleId, methodId, Number(p.amount), details ? JSON.stringify(details) : null]
        );
      }
    }

    // 6) update totales
    await conn.query(
      `UPDATE sales SET subtotal_amount = ?, tax_amount = ?, total_amount = ?
        WHERE id = ?`,
      [subtotalSaleAmount, taxSaleAmount, totalSaleAmount, saleId]
    );

    // 7) movimiento de stock (SALE)
    await stock.createMovement({
      orgId,
      branchId,
      type: 'SALE',
      ref_code: formatted,
      note: note || null,
      created_by: sellerId || null,
      items: items.map(x => ({ variant_id: x.variantId, quantity: Math.abs(Number(x.qty)) }))
    }, conn);

    // 8) CxC (AR) trx
    await conn.query(
      `INSERT INTO ar_transactions (org_id, branch_id, customer_id, trx_date, type, amount, currency, fx_rate, description,
                                    ref_doc_id, source_type, source_id, created_at)
       VALUES (?, ?, ?, NOW(), 'INVOICE', ?, 'ARS', 1.000000, ?, ?, 'INVOICE', ?, NOW())`,
      [orgId, branchId, finalCustomerId, totalSaleAmount, `Venta ${formatted}`, formatted, saleId]
    );

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: CREAR VENTA ---
    logAction({
      orgId: orgId,
      userId: sellerId, // El vendedor que hizo la venta
      actionType: 'CREATE',
      entityType: 'SALE',
      entityId: saleId, // El ID de la venta creada
      details: {
        docNumber: formatted,
        total: totalSaleAmount,
        customerId: finalCustomerId,
        itemsCount: items.length
      }
    });
    // --- FIN AUDITORÍA ---

    return { id: saleId, docText: formatted, docNumber: number, total: totalSaleAmount };

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Cancelar venta:
 * - (Auditoría añadida)
 */
async function cancelSale({ orgId, saleId, userId, reason }) {
  const conn = await pool.getConnection();
  let docNumberForAudit = ''; // Variable para guardar el nro de doc
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      // CORRECCIÓN: Seleccionar doc_number y total_amount
      `SELECT id, org_id, branch_id, doc_number, total_amount, status, customer_id
         FROM sales
        WHERE id = ? AND org_id = ? AND is_deleted = 0
        FOR UPDATE`,
      [saleId, orgId]
    );
    const s = rows[0];
    if (!s) throw new Error('NOT_FOUND');
    if (s.status === 'CANCELLED') throw new Error('ALREADY_CANCELLED');

    docNumberForAudit = s.doc_number; // Guardar para el log

    const [items] = await conn.query(
      `SELECT variant_id AS variantId, qty FROM sale_items
        WHERE sale_id = ? AND is_deleted = 0`,
      [saleId]
    );

    // Reponer stock (ajuste +qty)
    if (items.length > 0) { // Solo si hay ítems que reponer
      await stock.createMovement({
        orgId,
        branchId: s.branch_id,
        type: 'ADJUSTMENT',
        ref_code: `CANCEL ${s.doc_number}`,
        note: reason || 'Cancelación de venta',
        created_by: userId || null,
        items: items.map(x => ({ variant_id: x.variantId, quantity: Math.abs(Number(x.qty)) }))
      }, conn);
    }

    // CxC crédito (usar total_amount)
    await conn.query(
      `INSERT INTO ar_transactions (org_id, branch_id, customer_id, trx_date, type, amount, currency, fx_rate, description,
                                    ref_doc_id, source_type, source_id, created_at)
       VALUES (?, ?, ?, NOW(), 'CREDIT_NOTE', ?, 'ARS', 1.000000,
              ?, ?, 'INVOICE', ?, NOW())`,
      [s.org_id, s.branch_id, s.customer_id, (-1 * parseFloat(s.total_amount)), // Usar total_amount
       `Anulación Venta ${s.doc_number}`, s.doc_number, saleId]
    );

    // Actualizar estado de la venta
    await conn.query(
      `UPDATE sales SET status = 'CANCELLED', cancelled_at = NOW(), created_by = ?
        WHERE id = ?`, // 'created_by' se usa como 'cancelled_by' (o añade columna)
      [userId || null, saleId]
    );

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: CANCELAR VENTA ---
    logAction({
      orgId: orgId,
      userId: userId, // Quién hizo la cancelación
      actionType: 'CANCEL_SALE',
      entityType: 'SALE',
      entityId: saleId,
      details: {
        docNumber: docNumberForAudit,
        reason: reason || 'Sin motivo especificado'
      }
    });
    // --- FIN AUDITORÍA ---

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function registerSalePayments({ orgId, saleId, userId, payments }) {
  const conn = await pool.getConnection();
  let paymentIds = []; // Para el log
  try {
    await conn.beginTransaction();

    // 1. Validar la venta
    const [saleRows] = await conn.query(
      `SELECT id, status, doc_number FROM sales
       WHERE id = ? AND org_id = ? AND is_deleted = 0
       FOR UPDATE`,
      [saleId, orgId]
    );
    const sale = saleRows[0];
    if (!sale) { throw new Error('SALE_NOT_FOUND'); }
    if (sale.status === 'CANCELLED') { throw new Error('SALE_CANCELLED'); }

    // 2. Validar y obtener IDs de los métodos de pago
    const methodNames = payments.map(p => p.method);
    const methodPlaceholders = methodNames.map(() => '?').join(',');
    const [methodRows] = await conn.query(
      `SELECT id, name FROM payment_methods
       WHERE org_id = ? AND name IN (${methodPlaceholders}) AND is_deleted = 0 AND active = 1`,
      [orgId, ...methodNames]
    );
    const methodMap = new Map(methodRows.map(m => [m.name, m.id]));

    // 3. Insertar cada pago
    for (const p of payments) {
      const methodId = methodMap.get(p.method);
      if (!methodId) {
        throw new Error(`Método de pago '${p.method}' no encontrado o no activo para esta organización.`);
      }
      const details = p.note ? { note: p.note } : null;

      const [payResult] = await conn.query(
        `INSERT INTO sale_payments (sale_id, method_id, amount, details_json, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [saleId, methodId, Number(p.amount), details ? JSON.stringify(details) : null]
      );
      paymentIds.push(payResult.insertId);
    }

    // 4. (Opcional) Crear asientos en AR para los pagos
    // ... (Tu lógica iría aquí si es necesario) ...

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: AÑADIR PAGO ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'UPDATE', // Es una actualización de la venta
      entityType: 'SALE_PAYMENT',
      entityId: saleId, // Se asocia a la venta
      details: {
        docNumber: sale.doc_number,
        paymentsAdded: payments.map(p => ({ method: p.method, amount: p.amount })),
        paymentIds: paymentIds
      }
    });
    // --- FIN AUDITORÍA ---

    return paymentIds;

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  listSales,
  getSale,
  createSale,
  cancelSale,
  registerSalePayments
};
