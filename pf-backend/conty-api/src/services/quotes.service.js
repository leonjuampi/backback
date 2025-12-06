// src/services/quotes.service.js
const pool = require('../config/db');
const numbering = require('./numbering.service');
const stock = require('./stock.service');
const { upsertCustomerOnSale, getCustomer } = require('./customer.service');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');


async function listQuotes({ orgId, status, search, limit = 50, offset = 0 }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const wh = ['q.is_deleted = 0', 'q.org_id = ?'];
  const params = [orgId];
  if (status) { wh.push('q.status = ?'); params.push(status); }
  if (search) {
    wh.push('(q.number LIKE ? OR c.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  const [rows] = await pool.query(
    `SELECT q.id, q.number AS docText, q.status, q.total_amount AS total, q.valid_until AS validUntil,
            q.customer_id AS customerId, c.name AS customerName, q.created_at AS createdAt
       FROM quotes q
       LEFT JOIN customers c ON c.id = q.customer_id AND c.is_deleted = 0
      WHERE ${wh.join(' AND ')}
      ORDER BY q.id DESC
      LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows.map(r => ({ ...r, docText: r.docText || '' }));
}

async function getQuote(id, orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [hdr] = await pool.query(
    `SELECT q.*, c.name AS customerName
       FROM quotes q
       LEFT JOIN customers c ON c.id = q.customer_id AND c.is_deleted = 0
      WHERE q.id = ? AND q.org_id = ? AND q.is_deleted = 0
      LIMIT 1`,
    [id, orgId]
  );
  const q = hdr[0];
  if (!q) return null;
const [items] = await pool.query(
    `SELECT id, variant_id AS variantId, product_id AS productId, qty, price_unit AS unitPrice,
            discount_pct AS discountPercent, line_total AS total, line_total as subtotal,
            name_snapshot AS name, sku_snapshot AS sku
       FROM quote_items
      WHERE quote_id = ? AND is_deleted = 0
      ORDER BY id ASC`,
    [id]
  );
return {
    ...q,
    docText: q.number || '',
    // Mapeo explícito para el frontend
    branchId: q.branch_id,
    sellerId: q.seller_id,
    customerId: q.customer_id,
    validUntil: q.valid_until,
    items
  };
}

// --- Función createQuote (CON AUDITORÍA) ---
async function createQuote({ orgId, customerId, validUntil, items, note, createdBy }) {
  const conn = await pool.getConnection();
  let quoteId; // Definir fuera para auditoría
  let formatted; // Definir fuera para auditoría
  let number;
  let totalAmount = 0;

  try {
    await conn.beginTransaction();

    let finalCustomerId = customerId;
    if (!customerId) {
        finalCustomerId = await upsertCustomerOnSale({ orgId, branchId: null, createdBy: createdBy }, conn);
        if (!finalCustomerId) { throw new Error('CUSTOMER_CREATION_FAILED'); }
    } else {
        const existingCustomer = await getCustomer(customerId, orgId);
        if (!existingCustomer) { throw new Error('FORBIDDEN_CUSTOMER'); }
    }

    const posCode = '0001';
    const numData = await numbering.reserveNextNumber(conn, {
      orgId, docType: 'QUOTE', posCode
    });
    formatted = numData.formatted;
    number = numData.number;

    const [ins] = await conn.query(
      `INSERT INTO quotes (org_id, number, customer_id, status, notes, valid_until, created_at, created_by)
       VALUES (?, ?, ?, 'DRAFT', ?, ?, NOW(), ?)`,
      [orgId, formatted, finalCustomerId, note || null, validUntil || null, createdBy]
    );
    quoteId = ins.insertId;

    let subtotalAmount = 0;

    // ... (Lógica de validación de variantes) ...
    const variantIds = items.map(it => it.variantId);
     if (!variantIds.length) { throw new Error('Items array cannot be empty'); }
     const placeholders = variantIds.map(() => '?').join(',');
     const [variantDataRows] = await conn.query(
       `SELECT v.id, v.product_id, p.name AS product_name, v.sku
        FROM product_variants v
        JOIN products p ON p.id = v.product_id
        WHERE v.id IN (${placeholders}) AND p.org_id = ? AND v.is_deleted = 0 AND p.is_deleted = 0`,
       [...variantIds, orgId]
     );
     const variantDataMap = new Map(variantDataRows.map(v => [v.id, {
         productId: v.product_id,
         sku_snapshot: v.sku,
         name_snapshot: v.product_name
     }]));
     if (variantDataMap.size !== variantIds.length) {
         const missingIds = variantIds.filter(id => !variantDataMap.has(id));
         throw new Error(`FORBIDDEN_OR_NOT_FOUND (Quote): Variants not found or do not belong to org: ${missingIds.join(', ')}`);
     }

    for (const it of items) {
      // ... (Lógica de cálculo de ítems) ...
      const qty = Number(it.qty);
      const unit = Number(it.unitPrice);
      const disc = Number(it.discountPercent || 0);
      const variantInfo = variantDataMap.get(it.variantId);
      const productId = variantInfo.productId;
      const lineTotal = unit * (1 - disc / 100) * qty;
      subtotalAmount += lineTotal;
      totalAmount += lineTotal;

      await conn.query(
        `INSERT INTO quote_items (quote_id, product_id, variant_id, qty, price_unit, discount_pct, line_total, sku_snapshot, name_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [quoteId, productId, it.variantId, qty, unit, disc, lineTotal, variantInfo.sku_snapshot, variantInfo.name_snapshot]
      );
    }

    await conn.query(
      `UPDATE quotes SET subtotal_amount = ?, total_amount = ? WHERE id = ?`,
      [subtotalAmount, totalAmount, quoteId]
    );

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: CREAR PRESUPUESTO ---
    logAction({
      orgId: orgId,
      userId: createdBy,
      actionType: 'CREATE',
      entityType: 'QUOTE',
      entityId: quoteId,
      details: { docNumber: formatted, total: totalAmount, customerId: finalCustomerId }
    });
    // --- FIN AUDITORÍA ---

    return { id: quoteId, docText: formatted, docNumber: number, total: totalAmount };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// --- Función updateQuote (CON AUDITORÍA) ---
async function updateQuote({ orgId, quoteId, payload, updatedBy }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT id, status FROM quotes WHERE id = ? AND org_id = ? AND is_deleted = 0 FOR UPDATE`,
      [quoteId, orgId]
    );
    const quote = rows[0];
    if (!quote) throw new Error('NOT_FOUND: Presupuesto no encontrado o no pertenece a la organización.');

    // ... (Tu lógica de actualización de cabecera) ...
    const sets = [];
    const params = [];
    if (payload.customerId !== undefined) {
        if(payload.customerId !== null) {
            const customer = await getCustomer(payload.customerId, orgId);
            if (!customer) throw new Error('FORBIDDEN_CUSTOMER: Cliente no encontrado o no pertenece a la org.');
        }
        sets.push('customer_id = ?'); params.push(payload.customerId || null);
    }
    if (payload.status && ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED', 'CANCELLED'].includes(payload.status)) {
        sets.push('status = ?'); params.push(payload.status);
    }
    if (payload.notes !== undefined) { sets.push('notes = ?'); params.push(payload.notes || null); }
    if (payload.validUntil !== undefined) { sets.push('valid_until = ?'); params.push(payload.validUntil || null); }
    if (sets.length) {
      await conn.query(`UPDATE quotes SET ${sets.join(', ')} WHERE id = ?`, [...params, quoteId]);
    }

    // ... (Tu lógica de actualización de ítems) ...
    if (Array.isArray(payload.items)) {
      await conn.query(`UPDATE quote_items SET is_deleted = 1, deleted_at = NOW() WHERE quote_id = ? AND is_deleted = 0`, [quoteId]);
      const variantIds = payload.items.map(it => it.variantId);
       if (!variantIds.length && payload.items.length > 0) { throw new Error('Items array contains invalid variantIds'); }
       if (variantIds.length > 0) {
           const placeholders = variantIds.map(() => '?').join(',');
           const [variantDataRows] = await conn.query(
             `SELECT v.id, v.product_id, p.name AS product_name, v.sku
              FROM product_variants v JOIN products p ON p.id = v.product_id
              WHERE v.id IN (${placeholders}) AND p.org_id = ? AND v.is_deleted = 0 AND p.is_deleted = 0`,
             [...variantIds, orgId]
           );
           const variantDataMap = new Map(variantDataRows.map(v => [v.id, { productId: v.product_id, sku_snapshot: v.sku, name_snapshot: v.product_name }]));
           if (variantDataMap.size !== variantIds.length) { throw new Error(`FORBIDDEN_OR_NOT_FOUND (Update Quote): Variants invalid.`); }

           let subtotalAmount = 0;
           let totalAmount = 0;
           for (const it of payload.items) {
             // ... (cálculos de ítem) ...
             const qty = Number(it.qty);
             const unit = Number(it.unitPrice);
             const disc = Number(it.discountPercent || 0);
             const variantInfo = variantDataMap.get(it.variantId);
             const productId = variantInfo.productId;
             const lineTotal = unit * (1 - disc / 100) * qty;
             subtotalAmount += lineTotal;
             totalAmount += lineTotal;
             await conn.query(
               `INSERT INTO quote_items (quote_id, product_id, variant_id, qty, price_unit, discount_pct, line_total, sku_snapshot, name_snapshot)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
               [quoteId, productId, it.variantId, qty, unit, disc, lineTotal, variantInfo.sku_snapshot, variantInfo.name_snapshot]
             );
           }
           await conn.query(`UPDATE quotes SET subtotal_amount = ?, total_amount = ? WHERE id = ?`, [subtotalAmount, totalAmount, quoteId]);
       } else {
           await conn.query(`UPDATE quotes SET subtotal_amount = 0, total_amount = 0 WHERE id = ?`, [quoteId]);
       }
    }

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: ACTUALIZAR PRESUPUESTO ---
    logAction({
      orgId: orgId,
      userId: updatedBy,
      actionType: 'UPDATE',
      entityType: 'QUOTE',
      entityId: quoteId,
      details: { updatedFields: Object.keys(payload) }
    });
    // --- FIN AUDITORÍA ---

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// --- Función convertToSale (CON AUDITORÍA) ---
async function convertToSale({ orgId, quoteId, branchId, posCode, docType, sellerId }) {
  const conn = await pool.getConnection();
  let saleId; // Definir fuera para auditoría
  let formattedSaleNumber;
  let saleTotalAmount;

  try {
    await conn.beginTransaction();

    // ... (Lógica para obtener y validar quote - q) ...
    const [qr] = await conn.query(
      `SELECT id, customer_id, total_amount, subtotal_amount, status, notes
         FROM quotes
        WHERE id = ? AND org_id = ? AND is_deleted = 0
        FOR UPDATE`,
      [quoteId, orgId]
    );
    const q = qr[0];
    if (!q) throw new Error('NOT_FOUND: Presupuesto no encontrado o no pertenece a la organización.');
    if (q.status === 'CONVERTED') throw new Error('ALREADY_CONVERTED: El presupuesto ya fue convertido.');

    // ... (Lógica para obtener quoteItems) ...
    const [quoteItems] = await conn.query(
      `SELECT qi.variant_id AS variantId, qi.qty, qi.price_unit AS unitPrice, qi.discount_pct AS discountPercent,
              qi.product_id, qi.sku_snapshot, qi.name_snapshot,
              COALESCE(p.vat_percent, 0) as tax_pct
       FROM quote_items qi
       JOIN products p ON p.id = qi.product_id
       WHERE qi.quote_id = ? AND qi.is_deleted = 0 AND p.is_deleted = 0 AND p.org_id = ?`,
      [quoteId, orgId]
    );
     if (quoteItems.length === 0) {
         throw new Error('QUOTE_HAS_NO_ITEMS: El presupuesto no tiene ítems válidos para convertir.');
     }

    // ... (Lógica para validar/crear finalCustomerId) ...
     let finalCustomerId = q.customer_id;
     if (finalCustomerId) {
         const customer = await getCustomer(finalCustomerId, orgId);
         if (!customer) {
             console.warn(`Cliente ${finalCustomerId} del presupuesto ${quoteId} no encontrado o borrado. Se asignará a Consumidor Final.`);
             finalCustomerId = await upsertCustomerOnSale({ orgId, branchId, createdBy: sellerId }, conn);
         }
     } else {
         finalCustomerId = await upsertCustomerOnSale({ orgId, branchId, createdBy: sellerId }, conn);
     }

    // ... (Lógica de numeración) ...
    const numberingData = await numbering.reserveNextNumber(conn, { orgId, docType, posCode });
    formattedSaleNumber = numberingData.formatted;
    const saleNumber = numberingData.number;

    // ... (Lógica de INSERT INTO sales) ...
    const [ins] = await conn.query(
      `INSERT INTO sales (org_id, branch_id, doc_type, doc_number,
                          customer_id, seller_id, status, note, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, NOW(), ?)`,
      [orgId, branchId, docType, formattedSaleNumber, finalCustomerId, sellerId || null, `Convertido de presupuesto ${q.notes || ''}`.substring(0, 255), sellerId || null]
    );
    saleId = ins.insertId;

    // ... (Lógica de bucle for para sale_items y cálculo de totales) ...
    let saleSubtotal = 0;
    let saleTaxTotal = 0;
    const stockItems = [];
    for (const it of quoteItems) {
      const qty = Number(it.qty);
      const unit = Number(it.unitPrice);
      const disc = Number(it.discountPercent || 0);
      const tax = parseFloat(it.tax_pct);
      const priceAfterDisc = unit * (1 - disc / 100);
      const lineSubtotal = priceAfterDisc * qty;
      const lineTax = lineSubtotal * (tax / 100);
      const lineTotal = lineSubtotal + lineTax;
      saleSubtotal += lineSubtotal;
      saleTaxTotal += lineTax;
      await conn.query(
        `INSERT INTO sale_items (sale_id, product_id, variant_id, qty, price_unit, tax_pct, discount_pct, line_total, name_snapshot, sku_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [saleId, it.product_id, it.variantId, qty, unit, tax, disc, lineTotal, it.name_snapshot, it.sku_snapshot]
      );
      stockItems.push({ variant_id: it.variantId, quantity: Math.abs(qty) });
    }
    saleTotalAmount = saleSubtotal + saleTaxTotal;

    // ... (Lógica de UPDATE sales totales) ...
    await conn.query(
      `UPDATE sales SET subtotal_amount = ?, tax_amount = ?, total_amount = ? WHERE id = ?`,
      [saleSubtotal, saleTaxTotal, saleTotalAmount, saleId]
    );

    // ... (Lógica de stock.createMovement) ...
    // (createMovement registrará la auditoría de STOCK_MOVEMENT si es de tipo 'SALE')
    // (Pero sales.service.js audita 'CREATE_SALE' que es más genérico, así que estamos bien)
    await stock.createMovement({
      orgId,
      branchId,
      type: 'SALE',
      ref_code: formattedSaleNumber,
      created_by: sellerId || null,
      items: stockItems
    }, conn);

    // ... (Lógica de INSERT INTO ar_transactions) ...
    await conn.query(
      `INSERT INTO ar_transactions (org_id, branch_id, customer_id, trx_date, type, amount, currency, fx_rate, description,
                                    ref_doc_id, source_type, source_id, created_at)
       VALUES (?, ?, ?, NOW(), 'INVOICE', ?, 'ARS', 1.000000, ?, ?, 'INVOICE', ?, NOW())`,
      [orgId, branchId, finalCustomerId, saleTotalAmount, `Venta ${formattedSaleNumber} (de PRES)`, formattedSaleNumber, saleId]
    );

    // ... (Lógica de UPDATE quotes status) ...
    await conn.query(
      `UPDATE quotes SET status = 'CONVERTED', converted_sale_id = ? WHERE id = ?`,
      [saleId, quoteId]
    );

    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: CONVERTIR PRESUPUESTO ---
    // (El servicio 'sales.service' auditará la CREACIÓN de la venta,
    // así que aquí auditamos la ACCIÓN de conversión en sí misma)
    logAction({
      orgId: orgId,
      userId: sellerId,
      actionType: 'CONVERT_QUOTE',
      entityType: 'QUOTE',
      entityId: quoteId, // El ID del presupuesto
      details: {
          newSaleId: saleId, // El ID de la venta resultante
          newSaleDocNumber: formattedSaleNumber,
          total: saleTotalAmount
      }
    });
    // --- FIN AUDITORÍA ---

    return { saleId, docText: formattedSaleNumber, docNumber: saleNumber, total: saleTotalAmount };

  } catch (e) {
    await conn.rollback();
    if (e.message.startsWith('INSUFFICIENT_STOCK')) {
      throw new Error(e.message);
    }
    throw e;
  } finally {
    conn.release();
  }
}


module.exports = {
  listQuotes,
  getQuote,
  createQuote,
  updateQuote,
  convertToSale,
};
