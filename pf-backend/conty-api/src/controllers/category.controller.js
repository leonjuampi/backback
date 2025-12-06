// src/controllers/category.controller.js
const svc = require('../services/category.service');

function parseBool(v){ return ['1','true','yes','on'].includes(String(v).toLowerCase()); }

async function listCategories(req, res) {
  try {
    const orgId = req.user.orgId;
    const { search, includeSub, page = 1, pageSize = 50 } = req.query;
    const limit = Math.min(Number(pageSize) || 50, 100);
    const offset = ((Number(page) || 1) - 1) * limit;

    const [items, total] = await Promise.all([
      svc.queryCategories({ orgId, search, includeSub: parseBool(includeSub) }, { limit, offset }),
      svc.countCategories({ orgId, search })
    ]);

    res.json({ items, total, page: Number(page) || 1, pageSize: limit });
  } catch (e) {
    console.error('CATEGORIES_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createCategory(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    // Pasar userId al servicio
    const id = await svc.createCategory(orgId, name, userId);

    res.status(201).json({ id });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Category name already exists in this organization' });
    }
    console.error('CATEGORY_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateCategory(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const id = Number(req.params.id);
    const { name } = req.body;

    // Pasar userId al servicio
    await svc.updateCategory(orgId, id, { name }, userId);

    res.json({ message: 'Updated' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Category name already exists in this organization' });
    }
    console.error('CATEGORY_UPDATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteCategory(req, res) {
  try {
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const id = Number(req.params.id);

    const inUse = await svc.categoryInUse(id, orgId);
    if (inUse) return res.status(400).json({ message: 'Category is in use by products' });

    // Pasar userId al servicio
    await svc.deleteCategory(orgId, id, userId);

    res.status(204).send();
  } catch (e) {
    console.error('CATEGORY_DELETE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listSubcategories(req, res) {
  try {
    const categoryId = Number(req.params.id);
    const orgId = req.user.orgId;
    const items = await svc.listSubcategories(categoryId, orgId);
    res.json({ items });
  } catch (e) {
    if (e.message === 'FORBIDDEN_CATEGORY') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('SUBCATEGORIES_LIST_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createSubcategory(req, res) {
  try {
    const categoryId = Number(req.params.id);
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    // Pasar userId al servicio
    const id = await svc.createSubcategory(categoryId, name, orgId, userId);

    res.status(201).json({ id });
  } catch (e) {
    if (e.message === 'FORBIDDEN_CATEGORY') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Subcategory name already exists in this category' });
    }
    console.error('SUBCATEGORY_CREATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateSubcategory(req, res) {
  try {
    const subId = Number(req.params.subId);
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría
    const { name } = req.body;

    // Pasar userId al servicio
    const affectedRows = await svc.updateSubcategory(subId, { name }, orgId, userId);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Subcategory not found or forbidden' });
    }
    res.json({ message: 'Updated' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Subcategory name already exists in this category' });
    }
    console.error('SUBCATEGORY_UPDATE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteSubcategory(req, res) {
  try {
    const subId = Number(req.params.subId);
    const orgId = req.user.orgId;
    const userId = req.user.uid; // <-- Para auditoría

    const inUse = await svc.subcategoryInUse(subId, orgId);
    if (inUse) return res.status(400).json({ message: 'Subcategory is in use by products' });

    // Pasar userId al servicio
    const affectedRows = await svc.deleteSubcategory(subId, orgId, userId);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Subcategory not found or forbidden' });
    }
    res.status(204).send();
  } catch (e) {
    console.error('SUBCATEGORY_DELETE_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
};
