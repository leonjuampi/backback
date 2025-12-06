// src/services/product.service.js
const pool = require('../config/db');
// Importar funciones necesarias de otros servicios
const categorySvc = require('./category.service');
const { applyStockDelta } = require('./stock.service');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

// --- Funciones existentes (queryProducts, countProducts, getProduct, etc.) ---

function filtersWhere(f) {
  const wh = ['p.org_id = ?', 'p.is_deleted = 0'];
  const params = [f.orgId];

  if (f.search) {
    wh.push('(p.name LIKE ? OR p.sku LIKE ?)');
    const s = `%${f.search}%`;
    params.push(s, s);
  }
  if (f.categoryId) { wh.push('p.category_id = ?'); params.push(f.categoryId); }
  if (f.subcategoryId) { wh.push('p.subcategory_id = ?'); params.push(f.subcategoryId); }
  if (f.status) { wh.push('p.status = ?'); params.push(f.status); }

  // NOTA: El filtro de stockLow se maneja en queryProducts usando HAVING
  
  return { whereClause: `WHERE ${wh.join(' AND ')}`, params };
}

async function queryProducts(filters, { limit, offset }) {
  const { whereClause, params } = filtersWhere(filters);

  // --- LÓGICA DE STOCK REAL ---
  // Si filtramos por sucursal, sumamos solo esa. Si no, sumamos todas.
  let stockSubquery;
  if (filters.branchId) {
    stockSubquery = `
      (SELECT COALESCE(SUM(bvs.qty), 0)
       FROM branch_variant_stock bvs
       JOIN product_variants pv ON pv.id = bvs.variant_id
       WHERE pv.product_id = p.id AND pv.is_deleted = 0 AND bvs.branch_id = ${pool.escape(filters.branchId)})
    `;
  } else {
    stockSubquery = `
      (SELECT COALESCE(SUM(bvs.qty), 0)
       FROM branch_variant_stock bvs
       JOIN product_variants pv ON pv.id = bvs.variant_id
       WHERE pv.product_id = p.id AND pv.is_deleted = 0)
    `;
  }
  // ----------------------------

  let sql = `
    SELECT
      p.id, p.org_id, p.category_id, p.subcategory_id, p.sku, p.name,
      p.description, p.price, p.cost, p.vat_percent, p.status, p.created_at,
      c.name AS category_name, sc.name AS subcategory_name,
      ${stockSubquery} AS stock
    FROM products p
    JOIN categories c ON c.id = p.category_id AND c.is_deleted = 0
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id AND sc.is_deleted = 0
    ${whereClause}
  `;

  // Filtro de "Stock Bajo" usando HAVING porque 'stock' es calculado
  if (filters.stockLow) {
    sql += ` HAVING stock <= 10`; // Umbral fijo por ahora (idealmente p.min_stock)
  }

  sql += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`;

  const [rows] = await pool.query(sql, [...params, limit, offset]);
  return rows;
}

async function countProducts(filters) {
  const { whereClause, params } = filtersWhere(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${whereClause}`, params);
  return rows[0]?.total || 0;
}

async function getProduct(orgId, productId) {
  const [rows] = await pool.query(`
    SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
    FROM products p
    JOIN categories c ON c.id = p.category_id AND c.is_deleted = 0
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id AND sc.is_deleted = 0
    WHERE p.org_id = ? AND p.id = ? AND p.is_deleted = 0
    LIMIT 1
  `, [orgId, productId]);
  return rows[0];
}

async function getVariants(productId, orgId) {
  const [rows] = await pool.query(
    `SELECT v.id, v.product_id, v.name, v.sku, v.barcode, v.price, v.cost
     FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE v.product_id = ? AND p.org_id = ? AND v.is_deleted = 0 AND p.is_deleted = 0
     ORDER BY v.id ASC`,
    [productId, orgId]
  );
  return rows;
}

async function getVariantAndVerifyOrg(variantId, orgId, conn = null) {
  const c = conn || pool;
  const [rows] = await c.query(
    `SELECT v.*, p.org_id
     FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE v.id = ? AND v.is_deleted = 0 AND p.is_deleted = 0
     LIMIT 1`,
    [variantId]
  );
  if (!rows.length) {
    throw new Error('VARIANT_NOT_FOUND');
  }
  if (rows[0].org_id !== orgId) {
    throw new Error('FORBIDDEN: La variante no pertenece a esta organización.');
  }
  return rows[0];
}

async function getVariantStockForBranch(branchId, productId, orgId) {
  const [rows] = await pool.query(`
    SELECT pv.id AS variant_id, COALESCE(bvs.qty,0) AS qty, bvs.min_qty, bvs.max_qty
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    LEFT JOIN branch_variant_stock bvs ON bvs.variant_id = pv.id AND bvs.branch_id = ?
    WHERE pv.product_id = ? AND p.org_id = ? AND pv.is_deleted = 0 AND p.is_deleted = 0
    ORDER BY pv.id ASC
  `, [branchId, productId, orgId]);
  return rows;
}

// --- FUNCIÓN NUEVA PARA STOCK GLOBAL ---
async function getProductStockAllBranches(productId, orgId) {
  const [rows] = await pool.query(`
    SELECT bvs.variant_id, bvs.branch_id, COALESCE(bvs.qty, 0) as qty
    FROM branch_variant_stock bvs
    JOIN product_variants pv ON pv.id = bvs.variant_id
    JOIN products p ON p.id = pv.product_id
    WHERE p.id = ? AND p.org_id = ? AND p.is_deleted = 0
  `, [productId, orgId]);
  return rows;
}

async function createProduct(data) {
  const {
    orgId, categoryId, subcategoryId = null,
    name, description = null, price, cost, vat_percent = 0, status = 'ACTIVE',
    sku, createdBy = null
  } = data;

  const conn = pool;

  await categorySvc.getCategoryAndVerifyOrg(categoryId, orgId, conn);
  if(subcategoryId){
      await categorySvc.getSubcategoryAndVerifyOrg(subcategoryId, orgId, conn);
  }

  const [res] = await conn.query(`
    INSERT INTO products
    (org_id, category_id, subcategory_id, sku, name, description, price, cost, vat_percent, status, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
  `, [orgId, categoryId, subcategoryId, sku, name, description, price, cost, vat_percent, status, createdBy]);

  const productId = res.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR PRODUCTO ---
  logAction({
    orgId: orgId,
    userId: createdBy,
    actionType: 'CREATE',
    entityType: 'PRODUCT',
    entityId: productId,
    details: { sku: sku, name: name, price: price, cost: cost }
  });
  // --- FIN AUDITORÍA ---

  return productId;
}

async function updateProduct(orgId, productId, data) {
  const fields = [];
  const params = [];
  const map = {
    categoryId: 'category_id',
    subcategoryId: 'subcategory_id',
    vat_percent: 'vat_percent'
  };

  const conn = pool;

  if(data.categoryId){
      await categorySvc.getCategoryAndVerifyOrg(data.categoryId, orgId, conn);
  }
   if(data.subcategoryId){
       await categorySvc.getSubcategoryAndVerifyOrg(data.subcategoryId, orgId, conn);
   }

  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || k === 'orgId' || k === 'id') continue;
    const col = map[k] || k;
    fields.push(`${col} = ?`);
    params.push(v);
  }
  if (!fields.length) return;

  const sql = `UPDATE products SET ${fields.join(', ')}, updated_at = NOW()
               WHERE org_id = ? AND id = ? AND is_deleted = 0`;
  await conn.query(sql, [...params, orgId, productId]);

  // --- PUNTO DE AUDITORÍA: ACTUALIZAR PRODUCTO ---
  // (Asumimos que 'data' contiene 'updatedBy' seteado desde el controlador)
  logAction({
    orgId: orgId,
    userId: data.updatedBy || null,
    actionType: 'UPDATE',
    entityType: 'PRODUCT',
    entityId: productId,
    details: { updatedFields: Object.keys(data) } // Guardamos qué campos se intentaron actualizar
  });
  // --- FIN AUDITORÍA ---
}

async function deleteProduct(orgId, productId, userId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [prodRes] = await conn.query(
      `UPDATE products SET is_deleted = 1, deleted_at = NOW()
       WHERE org_id = ? AND id = ? AND is_deleted = 0`,
      [orgId, productId]
    );

    if(prodRes.affectedRows === 0){
        throw new Error('PRODUCT_NOT_FOUND_OR_FORBIDDEN');
    }

    await conn.query(
      `UPDATE product_variants SET is_deleted = 1, deleted_at = NOW()
       WHERE product_id = ? AND is_deleted = 0`,
      [productId]
    );
    await conn.commit();

    // --- PUNTO DE AUDITORÍA: ELIMINAR PRODUCTO ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'DELETE',
      entityType: 'PRODUCT',
      entityId: productId
    });
    // --- FIN AUDITORÍA ---

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function createVariant({ product_id, orgId, name = null, sku = null, barcode = null, price = null, cost = null, createdBy = null }) {
  const product = await getProduct(orgId, product_id);
  if (!product) {
      throw new Error('FORBIDDEN_PRODUCT: El producto no existe o no pertenece a esta organización.');
  }

  const [res] = await pool.query(`
    INSERT INTO product_variants (product_id, name, sku, barcode, price, cost)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [product_id, name, sku, barcode, price, cost]);
  const variantId = res.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR VARIANTE ---
  logAction({
    orgId: orgId,
    userId: createdBy,
    actionType: 'CREATE',
    entityType: 'PRODUCT_VARIANT',
    entityId: variantId,
    details: { productId: product_id, sku: sku, name: name }
  });
  // --- FIN AUDITORÍA ---

  return variantId;
}

async function updateVariant(variantId, data, orgId, userId = null) {
  const fields = [];
  const params = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || k === 'id' || k === 'product_id' || k === 'orgId' || k === 'updatedBy') continue;
    fields.push(`v.${k} = ?`);
    params.push(v);
  }
  if (!fields.length) return 0;

  const sql = `
    UPDATE product_variants v
    JOIN products p ON p.id = v.product_id
    SET ${fields.join(', ')}
    WHERE v.id = ? AND p.org_id = ? AND v.is_deleted = 0 AND p.is_deleted = 0`;

  const [res] = await pool.query(sql, [...params, variantId, orgId]);

  if (res.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ACTUALIZAR VARIANTE ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'UPDATE',
      entityType: 'PRODUCT_VARIANT',
      entityId: variantId,
      details: { updatedFields: Object.keys(data) }
    });
    // --- FIN AUDITORÍA ---
  }

  return res.affectedRows;
}

// --- FUNCIÓN DE IMPORTACIÓN CSV ---
async function processProductImport({ orgId, userId, products }) {
  const conn = await pool.getConnection();
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const categoryCache = new Map();
  const subcategoryCache = new Map();
  const branchCache = new Map();
  const createdProductSKUs = new Set();

  try {
    const [branches] = await conn.query(
        `SELECT id, name FROM branches WHERE org_id = ? AND is_deleted = 0`,
        [orgId]
    );
    branches.forEach(b => branchCache.set(b.name.trim().toLowerCase(), b.id));

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNumber = i + 2;
      let productId, variantId, stock, branchIdForStock;

      try {
        // ... (Validaciones) ...
        const requiredFields = ['product_sku', 'product_name', 'category', 'variant_sku', 'price', 'cost'];
        for (const field of requiredFields) { if (!row[field] || String(row[field]).trim() === '') throw new Error(`Columna requerida '${field}' vacía o faltante.`); }
        const productSKU = String(row.product_sku).trim();
        const productName = String(row.product_name).trim();
        const categoryName = String(row.category).trim();
        const subcategoryName = row.subcategory ? String(row.subcategory).trim() : null;
        const description = row.description ? String(row.description).trim() : null;
        const variantSKU = String(row.variant_sku).trim();
        const variantName = row.variant_name ? String(row.variant_name).trim() : null;
        const barcode = row.barcode ? String(row.barcode).trim() : null;
        const price = parseFloat(row.price);
        const cost = parseFloat(row.cost);
        const vat_percent = parseFloat(row.vat_percent || 0);
        stock = (row.stock !== undefined && String(row.stock).trim() !== '') ? parseInt(row.stock) : null;
        const branch_name = row.branch_name ? String(row.branch_name).trim().toLowerCase() : null;
        branchIdForStock = null;
        
        if (isNaN(price) || isNaN(cost) || isNaN(vat_percent)) { throw new Error('Valores numéricos inválidos para price, cost o vat_percent.'); }
        if (stock !== null && isNaN(stock)) { throw new Error('Valor inválido para stock (debe ser un número entero).');}
        
        if (stock !== null && stock !== 0) {
            if (!branch_name) throw new Error('Se especificó stock pero falta la columna branch_name.');
            branchIdForStock = branchCache.get(branch_name);
            if (!branchIdForStock) throw new Error(`Sucursal '${row.branch_name}' no encontrada o inactiva en esta organización.`);
        }

        // ... (Lógica de importación: Category, Product, Variant, Stock) ...
        // (Mismo código que tenías, omitido para brevedad pero debe estar en el archivo final)
        
        // --- GET/CREATE CATEGORY ---
        let categoryId = categoryCache.get(categoryName);
        if (!categoryId) {
          const [existingCat] = await conn.query(`SELECT id FROM categories WHERE org_id = ? AND name = ? AND is_deleted = 0 LIMIT 1`, [orgId, categoryName]);
          if (existingCat.length) { categoryId = existingCat[0].id; }
          else {
            categoryId = await categorySvc.createCategory(orgId, categoryName, conn);
          }
          categoryCache.set(categoryName, categoryId);
        }
        // --- GET/CREATE SUBCATEGORY ---
        let subcategoryId = null;
        if (categoryId && subcategoryName) {
          const subKey = `${categoryId}-${subcategoryName}`;
          subcategoryId = subcategoryCache.get(subKey);
          if (!subcategoryId) {
            const [existingSub] = await conn.query(`SELECT id FROM subcategories WHERE category_id = ? AND name = ? AND is_deleted = 0 LIMIT 1`, [categoryId, subcategoryName]);
            if (existingSub.length) { subcategoryId = existingSub[0].id; }
            else {
              const [subResult] = await conn.query('INSERT INTO subcategories (category_id, name) VALUES (?, ?)', [categoryId, subcategoryName]);
              subcategoryId = subResult.insertId;
            }
            subcategoryCache.set(subKey, subcategoryId);
          }
        }

        // --- GET/CREATE PRODUCT ---
        if (!createdProductSKUs.has(productSKU)) {
             try {
                 const [productResult] = await conn.query(
                   `INSERT INTO products (org_id, category_id, subcategory_id, sku, name, description, price, cost, vat_percent, status, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), ?)`,
                   [orgId, categoryId, subcategoryId, productSKU, productName, description, price, cost, vat_percent, userId]
                 );
                 productId = productResult.insertId;
                 createdProductSKUs.add(productSKU);
             } catch (err) {
                 if (err.code === 'ER_DUP_ENTRY' && err.message.includes('uq_product_sku_active')) {
                     const [existingProd] = await conn.query('SELECT id FROM products WHERE org_id = ? AND sku = ? AND is_deleted = 0', [orgId, productSKU]);
                     if (!existingProd.length) throw new Error(`SKU '${productSKU}' duplicado pero no se pudo encontrar.`);
                     productId = existingProd[0].id;
                     createdProductSKUs.add(productSKU);
                 } else { throw err; }
             }
        } else {
             const [existingProd] = await conn.query('SELECT id FROM products WHERE org_id = ? AND sku = ? AND is_deleted = 0', [orgId, productSKU]);
             productId = existingProd[0].id;
        }

        // --- CREATE VARIANT ---
        if (!variantSKU || variantSKU.trim() === '') { throw new Error(`Variante SKU está vacío.`); }
        try {
            const [variantResult] = await conn.query(
              `INSERT INTO product_variants (product_id, name, sku, barcode, price, cost, is_deleted) VALUES (?, ?, ?, ?, ?, ?, 0)`,
              [productId, variantName, variantSKU, barcode, price, cost]
            );
             variantId = variantResult.insertId;
        } catch (err) {
             if (err.code === 'ER_DUP_ENTRY') throw new Error(`Variante SKU '${variantSKU}' duplicada.`);
             throw err;
        }

        // --- APPLY INITIAL STOCK ---
        if (stock !== null && stock !== 0 && branchIdForStock && variantId) {
            await applyStockDelta(branchIdForStock, variantId, stock, null, conn);
            await conn.query(
                `INSERT INTO stock_movements (org_id, branch_id, type, ref_code, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [orgId, branchIdForStock, 'ENTRY', 'CSV_IMPORT', `Importación CSV fila ${rowNumber}`, userId]
            );
            const [movResult] = await conn.query('SELECT LAST_INSERT_ID() as id');
            const movementId = movResult[0].id;
            await conn.query(
                `INSERT INTO stock_movement_items (movement_id, variant_id, quantity) VALUES (?, ?, ?)`,
                [movementId, variantId, stock]
            );
        }

        successCount++;

      } catch (rowError) {
        errorCount++;
        errors.push({ row: rowNumber, message: rowError.message, data: row });
        console.error(`[IMPORT ROW ${rowNumber}] Error: ${rowError.message}`);
      }
    } 

    // --- PUNTO DE AUDITORÍA: IMPORTAR PRODUCTOS ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'IMPORT_PRODUCTS',
      entityType: 'PRODUCT',
      details: { successCount, errorCount, errors }
    });

    return { successCount, errorCount, errors };

  } catch (globalError) {
    console.error('[PRODUCTS_IMPORT_CSV] Service Error:', globalError);
    return { successCount, errorCount, errors, globalError: `Error inesperado: ${globalError.message}` };
  } finally {
    conn.release();
  }
}

// --- Make sure all functions are exported ---
module.exports = {
  queryProducts,
  countProducts,
  getProduct,
  getVariants,
  getVariantAndVerifyOrg,
  getVariantStockForBranch,
  getProductStockAllBranches, // <--- NUEVO EXPORT
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  processProductImport
};