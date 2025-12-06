// controllers/customer.controller.js (CORREGIDO)
const customerService = require('../services/customer.service');
const csvParser = require('csv-parser');
const stream = require('stream');
const pool = require('../config/db');

function parseBool(v) {
  if (v === undefined) return undefined;
  return ['1','true','yes','on'].includes(String(v).toLowerCase());
}

async function listCustomers(req, res) {
  try {
    const {
      search,
      priceListId,
      status,
      withDebt,
      noPurchasesDays,
      page = 1,
      pageSize = 20
    } = req.query;

    const orgId = req.user.orgId;

    const filters = {
      orgId,
      search,
      priceListId: priceListId ? Number(priceListId) : undefined,
      status,
      withDebt: parseBool(withDebt),
      noPurchasesDays: noPurchasesDays ? Number(noPurchasesDays) : undefined
    };

    const limit = Math.min(Number(pageSize) || 20, 100);
    const offset = ((Number(page) || 1) - 1) * limit;

    const [items, total] = await Promise.all([
      customerService.queryCustomers(filters, { limit, offset }),
      customerService.countCustomers(filters)
    ]);

    res.json({ items, total, page: Number(page) || 1, pageSize: limit });
  } catch (e) {
    console.error('CUSTOMERS_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getCustomerById(req, res) {
  try {
    const id = Number(req.params.id);
    const orgId = req.user.orgId;

    const base = await customerService.getCustomer(id, orgId);

    if (!base) return res.status(404).json({ message: 'Not found' });

    const [balance, tags] = await Promise.all([
      customerService.getBalanceByCustomer(id, orgId),
      customerService.getTagsByCustomer(id, orgId)
    ]);

    res.json({ ...base, balance, tags });
  } catch (e) {
    console.error('CUSTOMER_GET_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createCustomer(req, res) {
  try {
    const {
      name, taxId, email, phone, address,
      taxCondition, priceListId, status, notes, tags
    } = req.body;

    const orgId = req.user.orgId;

    // Roles 2 (Owner) y 3 (Vendedor) pueden crear clientes (según customer.routes.js)
    // if (req.user.roleId !== 2 && req.user.roleId !== 3) { // Esta validación ya la hace authorizeRoles
    //    return res.status(403).json({ message: 'Forbidden: Only Owner/Seller can create customers.' });
    // }

    if (!name || !taxCondition || !priceListId || !status) {
      return res.status(400).json({ message: 'Missing required fields: name, taxCondition, priceListId, status.' });
    }

    const [plCheck] = await pool.query('SELECT 1 FROM price_lists WHERE id = ? AND org_id = ? AND is_deleted = 0', [priceListId, orgId]);
    if(!plCheck.length) {
        return res.status(400).json({ message: 'priceListId not found for this organization.'});
    }

    const customerId = await customerService.insertCustomer({
      orgId,
      name, taxId, email, phone, address,
      taxCondition, priceListId, status, notes,
      createdBy: req.user?.uid || null // <-- Pasa el userId para auditoría
    });

    if (Array.isArray(tags) && tags.length) {
      await customerService.upsertTagsForCustomer(customerId, orgId, tags);
    }

    res.status(201).json({ id: customerId });
  } catch (e) {
    console.error('CUSTOMER_CREATE_ERROR:', e);
     if (e.code === 'ER_DUP_ENTRY') {
       return res.status(409).json({ message: 'Customer already exists with the provided unique data (e.g., taxId).' });
     }
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateCustomer(req, res) {
  try {
    const id = Number(req.params.id);
    const orgId = req.user.orgId;
    // Pasa updatedBy (userId) para auditoría
    const payload = { ...req.body, updatedBy: req.user?.uid || null };

    if(payload.priceListId) {
        const [plCheck] = await pool.query('SELECT 1 FROM price_lists WHERE id = ? AND org_id = ? AND is_deleted = 0', [payload.priceListId, orgId]);
        if(!plCheck.length) {
            return res.status(400).json({ message: 'priceListId not found for this organization.'});
        }
    }

    const affectedRows = await customerService.updateCustomerById(id, payload, orgId);

    if (affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found or forbidden.' });
    }

    if (Array.isArray(req.body.tags)) {
      // Pasa el orgId para la validación de tags
      await customerService.upsertTagsForCustomer(id, orgId, req.body.tags);
    }
    res.json({ message: 'Updated' });
  } catch (e) {
    console.error('CUSTOMER_UPDATE_ERROR:', e);
     if (e.code === 'ER_DUP_ENTRY') {
       return res.status(409).json({ message: 'Customer already exists with the provided unique data (e.g., taxId).' });
     }
    return res.status(500).json({ message: 'Server error' });
  }
}

async function softDeleteCustomer(req, res) {
  try {
    const id = Number(req.params.id);
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Pasa el userId para auditoría

    const affectedRows = await customerService.softDeleteCustomerById(id, userId, orgId);

     if (affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found or forbidden.' });
    }

    res.status(204).send();
  } catch (e) {
    console.error('CUSTOMER_DELETE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getCustomerStatement(req, res) {
  try {
    const id = Number(req.params.id);
    const { from, to } = req.query;
    const orgId = req.user.orgId;

    const customer = await customerService.getCustomer(id, orgId);
    if (!customer) return res.status(404).json({ message: 'Not found' });

    const { items, balance } = await customerService.getStatementByCustomer(id, { from, to }, orgId);
    res.json({ items, balance });
  } catch (e) {
    console.error('CUSTOMER_STATEMENT_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getCustomerCsvTemplate(req, res) {
  try {
    const csvHeader = [
      'name', 'taxId', 'email', 'phone', 'address', 'taxCondition',
      'priceListName', 'status', 'notes', 'tags'
    ].join(',');

    const csvExample1 = [
      'Cliente Mayorista A', '20-11223344-5', 'compras@clientea.com', '1155443322', 'Calle Falsa 123, CABA', 'RI',
      'Mayorista', 'ACTIVE', 'Cliente de confianza', 'VIP|Preferencial'
    ].join(',');
    const csvExample2 = [
      'Consumidor Final B', '99-99999999-9', 'cf@example.com', '1166778899', 'Av. Corrientes 456, CABA', 'CF',
      'General', 'ACTIVE', '', ''
    ].join(',');

    const csv = [csvHeader, csvExample1, csvExample2].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="customers_template.csv"');
    res.status(200).send(csv);
  } catch (e) {
      console.error('CSV_TEMPLATE_ERROR:', e);
      res.status(500).json({ message: 'Error al generar la plantilla CSV' });
  }
}

async function importCustomersFromCSV(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid;

    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const customersToImport = [];
    const parsePromise = new Promise((resolve, reject) => {
      bufferStream
        .pipe(csvParser())
        .on('data', (row) => customersToImport.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    await parsePromise;

    if (customersToImport.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or invalid.' });
    }

    const importResult = await customerService.processCustomerImport({
      orgId,
      userId,
      customers: customersToImport,
    });

    res.status(200).json(importResult);

  } catch (error) {
    console.error('[CUSTOMERS_IMPORT_CSV] Controller Error:', error);
    if (error.message.includes('CSV')) {
        return res.status(400).json({ message: `Error parsing CSV: ${error.message}` });
    }
    if (error.message.includes('No se encontraron Listas de Precios')) {
         return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during import.' });
  }
}

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
  getCustomerStatement,
  getCustomerCsvTemplate,
  importCustomersFromCSV
};
