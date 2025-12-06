// src/controllers/product.controller.js
const svc = require('../services/product.service');
const stockSvc = require('../services/stock.service');
const csvParser = require('csv-parser');
const stream = require('stream');
// --- Helper function (si no la tienes en un utils) ---
function parseBool(v) {
  if (v === undefined) return undefined;
  return ['1','true','yes','on'].includes(String(v).toLowerCase());
}

async function listProducts(req, res) {
  try {
    const { search, categoryId, subcategoryId, status, stockLow, branchId, page = 1, pageSize = 20 } = req.query;
    const orgId = req.user.orgId ?? null;
    const roleId = req.user.roleId;

    const effectiveBranchId = branchId ? Number(branchId) : (req.user.branchId ?? null);
    const filters = {
      orgId,
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      subcategoryId: subcategoryId ? Number(subcategoryId) : undefined,
      status,
      stockLow: parseBool(stockLow),
      branchId: effectiveBranchId
    };
    const limit = Math.min(Number(pageSize) || 20, 100);
    const offset = ((Number(page) || 1) - 1) * limit;

    const [items, total] = await Promise.all([
      svc.queryProducts(filters, { limit, offset }),
      svc.countProducts(filters)
    ]);

    res.json({ items, total, page: Number(page) || 1, pageSize: limit });
  } catch (e) {
    console.error('PRODUCTS_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getProductById(req, res) {
  try {
    const id = Number(req.params.id);
    const orgId = req.user.orgId ?? null;
    const branchId = req.query.branchId ? Number(req.query.branchId) : (req.user.branchId ?? null);

    const base = await svc.getProduct(orgId, id);
    if (!base) return res.status(404).json({ message: 'Not found' });

    // Pasamos 'orgId' a las funciones de servicio
    const [variants, stockByBranch] = await Promise.all([
      svc.getVariants(id, orgId),
      branchId ? svc.getVariantStockForBranch(branchId, id, orgId) : []
    ]);

    res.json({ ...base, variants, stock: stockByBranch });
  } catch (e) {
    console.error('PRODUCT_GET_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createProduct(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid;
    // Añadimos 'createdBy' al payload
    const payload = { ...req.body, orgId, createdBy: userId };

    const productId = await svc.createProduct(payload);

    // Si se crea un producto simple, también se crea una variante default
    if (req.body.sku) {
      await svc.createVariant({
        product_id: productId,
        orgId: orgId,
        name: null, // Sin nombre específico
        sku: req.body.sku,
        barcode: req.body.barcode || null, // Usar barcode si viene
        price: req.body.price,
        cost: req.body.cost,
        createdBy: userId // Auditar quién creó la variante default
      });
    }
    res.status(201).json({ id: productId });
  } catch (e) {
    console.error('PRODUCT_CREATE_ERROR:', e);
    if (e.message.startsWith('FORBIDDEN') || e.message.includes('not found') || e.message.startsWith('SKU')) {
      return res.status(400).json({ message: e.message });
    }
    if (e.code === 'ER_DUP_ENTRY') {
       return res.status(409).json({ message: `SKU '${req.body.sku}' ya existe.`});
    }
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);
    const orgId = req.user.orgId;
    const userId = req.user.uid;
    // --- CORRECCIÓN DE AUDITORÍA ---
    // Añadimos 'updatedBy' al payload para el log de auditoría
    const payload = { ...req.body, updatedBy: userId };

    await svc.updateProduct(orgId, id, payload); // Pasar el payload completo
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('PRODUCT_UPDATE_ERROR:', e);
     if (e.message.startsWith('FORBIDDEN') || e.message.includes('not found')) {
      return res.status(400).json({ message: e.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);
    const orgId = req.user.orgId;
    const userId = req.user.uid; // --- CORRECCIÓN DE AUDITORÍA ---

    // Pasamos 'userId' para el log de auditoría
    await svc.deleteProduct(orgId, id, userId);
    res.status(204).send();
  } catch (e) {
     if (e.message === 'PRODUCT_NOT_FOUND_OR_FORBIDDEN') {
        return res.status(404).json({ message: 'Product not found or forbidden.' });
     }
    console.error('PRODUCT_DELETE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createVariant(req, res) {
  try {
    const productId = Number(req.params.id);
    const orgId = req.user.orgId;
    const userId = req.user.uid; // --- CORRECCIÓN DE AUDITORÍA ---

    // Pasamos 'createdBy' para el log de auditoría
    const variantId = await svc.createVariant({
      ...req.body,
      product_id: productId,
      orgId: orgId,
      createdBy: userId
    });
    res.status(201).json({ id: variantId });
  } catch (e) {
     if (e.message.startsWith('FORBIDDEN_PRODUCT')) {
        return res.status(403).json({ message: e.message });
     }
     if (e.code === 'ER_DUP_ENTRY' || e.message.startsWith('Variante SKU duplicada')) {
       return res.status(409).json({ message: e.message });
     }
    console.error('VARIANT_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateVariant(req, res) {
  try {
    const variantId = Number(req.params.variantId);
    const orgId = req.user.orgId;
    const userId = req.user.uid; // --- CORRECCIÓN DE AUDITORÍA ---

    // Pasamos 'userId' para el log de auditoría
    const affectedRows = await svc.updateVariant(variantId, req.body, orgId, userId);

    if(affectedRows === 0){
        return res.status(404).json({ message: 'Variant not found or forbidden' });
    }
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('VARIANT_UPDATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createStockMovement(req, res) {
  // (Esta función está duplicada de stock.controller.js, pero la corregimos por si acaso)
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid;
    const { type, items, ref_code, note } = req.body;

    const branchId = req.body.branchId ? Number(req.body.branchId) : (req.user.branchId ?? null);
    if (!branchId) return res.status(400).json({ message: 'branchId required' });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'items required' });

    const movementId = await stockSvc.createMovement({
      orgId, branchId, type, ref_code, note, created_by: userId, items
    });

    res.status(201).json({ id: movementId });
  } catch (e) {
     if (e.message.startsWith('INSUFFICIENT_STOCK')) {
      return res.status(400).json({ message: e.message });
    }
    console.error('STOCK_MOV_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createTransfer(req, res) {
   // (Esta función está duplicada de stock.controller.js, pero la corregimos por si acaso)
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid;
    const { transfer_ref, originBranchId, destBranchId, items } = req.body;
    if (!originBranchId || !destBranchId) return res.status(400).json({ message: 'originBranchId and destBranchId required' });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'items required' });

    const result = await stockSvc.createTransfer({
      orgId, userId, transfer_ref: transfer_ref || `TR_${Date.now()}`,
      originBranchId, destBranchId, items
    });

    res.status(201).json(result);
  } catch (e) {
     if (e.message.startsWith('INSUFFICIENT_STOCK')) {
      return res.status(400).json({ message: e.message });
    }
    console.error('TRANSFER_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getCsvTemplate(_req, res) {
  // ... (Tu código existente aquí - sin cambios) ...
  const csvHeader = [
    'product_sku', 'product_name', 'category', 'subcategory', 'description', 'vat_percent',
    'variant_sku', 'variant_name', 'price', 'cost', 'barcode',
    'stock', 'branch_name'
  ].join(',');

  const csvExample1 = [
     'REM-AZ-01', 'Remera Azul', 'Indumentaria', 'Remeras', 'Algodón peinado', '21',
     'REM-AZ-01-S', 'Talle S', '7500', '3500', '779111S',
     '50', 'Sucursal Unica'
  ].join(',');
   const csvExample2 = [
       'PANT-CG-01', 'Pantalon Cargo', 'Indumentaria', '', 'Gabardina', '21',
       'PANT-CG-01-42', 'Talle 42', '12000', '6000', '77922242',
       '30', 'Sucursal Unica'
   ].join(',');

  const csv = [csvHeader, csvExample1, csvExample2].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="products_variants_template.csv"');
  res.status(200).send(csv);
}

async function importProductsFromCSV(req, res) {
  // ... (Tu código existente aquí - sin cambios) ...
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid;

    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const productsToImport = [];
    const parsePromise = new Promise((resolve, reject) => {
      bufferStream
        .pipe(csvParser())
        .on('data', (row) => {
          productsToImport.push(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await parsePromise;

    if (productsToImport.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or invalid.' });
    }

    const importResult = await svc.processProductImport({
      orgId,
      userId,
      products: productsToImport,
    });

    res.status(200).json(importResult);

  } catch (error) {
    console.error('[PRODUCTS_IMPORT_CSV] Controller Error:', error);
    if (error.message.includes('CSV')) {
        return res.status(400).json({ message: `Error parsing CSV: ${error.message}` });
    }
    res.status(500).json({ message: 'Server error during import.' });
  }
}

// --- Make sure all functions are exported ---
module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  createStockMovement,
  createTransfer,
  getCsvTemplate,
  importProductsFromCSV
};
