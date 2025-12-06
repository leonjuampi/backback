// src/services/category.service.js
const pool = require('../config/db');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

async function getCategoryAndVerifyOrg(categoryId, orgId, conn = null) {
  const c = conn || pool;
  const [rows] = await c.query(
    `SELECT id, org_id FROM categories WHERE id = ? AND org_id = ? AND is_deleted = 0 LIMIT 1`,
    [categoryId, orgId]
  );
  if (!rows.length) {
    throw new Error('FORBIDDEN_CATEGORY: Categoría no encontrada o no pertenece a la organización.');
  }
  return rows[0];
}

async function getSubcategoryAndVerifyOrg(subId, orgId, conn = null) {
  const c = conn || pool;
  const [rows] = await c.query(
    `SELECT s.id, s.category_id, c.org_id
     FROM subcategories s
     JOIN categories c ON c.id = s.category_id
     WHERE s.id = ? AND s.is_deleted = 0 AND c.is_deleted = 0
     LIMIT 1`,
    [subId]
  );
  if (!rows.length) {
    throw new Error('SUBCATEGORY_NOT_FOUND');
  }
  if (rows[0].org_id !== orgId) {
    throw new Error('FORBIDDEN: La subcategoría no pertenece a esta organización.');
  }
  return rows[0];
}


function whereCategories({ orgId, search }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const wh = ['c.org_id = ?', 'c.is_deleted = 0'];
  const params = [orgId];
  if (search) { wh.push('c.name LIKE ?'); params.push(`%${search}%`); }
  return { where: `WHERE ${wh.join(' AND ')}`, params };
}

async function queryCategories({ orgId, search, includeSub }, { limit, offset }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const { where, params } = whereCategories({ orgId, search });

  if (includeSub) {
    const [rows] = await pool.query(`
      SELECT
        c.id, c.org_id, c.name,
        sc.id AS sub_id, sc.name AS sub_name
      FROM categories c
      LEFT JOIN subcategories sc
        ON sc.category_id = c.id AND sc.is_deleted = 0
      ${where}
      ORDER BY c.name ASC, sc.name ASC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const byId = new Map();
    for (const r of rows) {
      if (!byId.has(r.id)) byId.set(r.id, { id: r.id, org_id: r.org_id, name: r.name, subcategories: [] });
      if (r.sub_id) byId.get(r.id).subcategories.push({ id: r.sub_id, name: r.sub_name });
    }
    return Array.from(byId.values());
  } else {
    const [rows] = await pool.query(`
      SELECT c.id, c.org_id, c.name
      FROM categories c
      ${where}
      ORDER BY c.name ASC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    return rows;
  }
}

async function countCategories({ orgId, search }) {
  // ... (Tu código existente aquí - sin cambios) ...
  const { where, params } = whereCategories({ orgId, search });
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM categories c ${where}`, params);
  return rows[0]?.total || 0;
}

async function createCategory(orgId, name, userId, conn = null) {
  const connection = conn || pool;
  const [res] = await connection.query(`
    INSERT INTO categories (org_id, name) VALUES (?, ?)
  `, [orgId, name]);
  const categoryId = res.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR CATEGORÍA ---
  logAction({
    orgId: orgId,
    userId: userId,
    actionType: 'CREATE',
    entityType: 'CATEGORY',
    entityId: categoryId,
    details: { name: name }
  });
  // --- FIN AUDITORÍA ---

  return categoryId;
}

async function updateCategory(orgId, id, { name }, userId, conn = null) {
  const connection = conn || pool;
  const sets = [];
  const params = [];
  if (name !== undefined) { sets.push('name = ?'); params.push(name); }
  if (!sets.length) return 0; // No hay nada que actualizar

  const [result] = await connection.query(
    `UPDATE categories SET ${sets.join(', ')}
     WHERE id = ? AND org_id = ? AND is_deleted = 0`,
    [...params, id, orgId]
  );

  if (result.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ACTUALIZAR CATEGORÍA ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'UPDATE',
      entityType: 'CATEGORY',
      entityId: id,
      details: { newName: name }
    });
    // --- FIN AUDITORÍA ---
  }
  return result.affectedRows;
}

async function deleteCategory(orgId, id, userId = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [catRes] = await conn.query(
      `UPDATE categories
       SET is_deleted = 1, deleted_at = NOW()
       WHERE id = ? AND org_id = ? AND is_deleted = 0`,
      [id, orgId]
    );

    if (catRes.affectedRows === 0) {
        throw new Error('NOT_FOUND: Categoría no encontrada o ya eliminada.');
    }

    await conn.query(
      `UPDATE subcategories
       SET is_deleted = 1, deleted_at = NOW()
       WHERE category_id = ? AND is_deleted = 0`,
      [id]
    );
    await conn.commit(); // <-- TRANSACCIÓN EXITOSA

    // --- PUNTO DE AUDITORÍA: ELIMINAR CATEGORÍA ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'DELETE',
      entityType: 'CATEGORY',
      entityId: id
    });
    // --- FIN AUDITORÍA ---

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function categoryInUse(categoryId, orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  const [rows] = await pool.query(
    `SELECT 1 FROM products
     WHERE category_id = ? AND org_id = ? AND is_deleted = 0
     LIMIT 1`,
    [categoryId, orgId]
  );
  return !!rows.length;
}

async function listSubcategories(categoryId, orgId) {
  // ... (Tu código existente aquí - sin cambios) ...
  await getCategoryAndVerifyOrg(categoryId, orgId);

  const [rows] = await pool.query(`
    SELECT id, category_id, name
    FROM subcategories
    WHERE category_id = ? AND is_deleted = 0
    ORDER BY name ASC
  `, [categoryId]);
  return rows;
}

async function createSubcategory(categoryId, name, orgId, userId, conn = null) {
  const connection = conn || pool;
  // Validar que la categoría padre pertenezca a la org
  await getCategoryAndVerifyOrg(categoryId, orgId, connection);

  const [res] = await connection.query(`
    INSERT INTO subcategories (category_id, name) VALUES (?, ?)
  `, [categoryId, name]);
  const subId = res.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR SUBCATEGORÍA ---
  logAction({
    orgId: orgId,
    userId: userId,
    actionType: 'CREATE',
    entityType: 'SUBCATEGORY',
    entityId: subId,
    details: { name: name, parentCategoryId: categoryId }
  });
  // --- FIN AUDITORÍA ---

  return subId;
}

async function updateSubcategory(subId, { name }, orgId, userId, conn = null) {
  const connection = conn || pool;
  const sets = [];
  const params = [];
  if (name !== undefined) { sets.push('s.name = ?'); params.push(name); }
  if (!sets.length) return 0;

  const [res] = await connection.query(
    `UPDATE subcategories s
     JOIN categories c ON c.id = s.category_id
     SET ${sets.join(', ')}
     WHERE s.id = ? AND c.org_id = ? AND s.is_deleted = 0`,
    [...params, subId, orgId]
  );

  if (res.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ACTUALIZAR SUBCATEGORÍA ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'UPDATE',
      entityType: 'SUBCATEGORY',
      entityId: subId,
      details: { newName: name }
    });
    // --- FIN AUDITORÍA ---
  }
  return res.affectedRows;
}

async function deleteSubcategory(subId, orgId, userId, conn = null) {
  const connection = conn || pool;
  const [res] = await connection.query(
    `UPDATE subcategories s
     JOIN categories c ON c.id = s.category_id
     SET s.is_deleted = 1, s.deleted_at = NOW()
     WHERE s.id = ? AND c.org_id = ? AND s.is_deleted = 0`,
    [subId, orgId]
  );

  if (res.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: ELIMINAR SUBCATEGORÍA ---
    logAction({
      orgId: orgId,
      userId: userId,
      actionType: 'DELETE',
      entityType: 'SUBCATEGORY',
      entityId: subId
    });
    // --- FIN AUDITORÍA ---
  }
  return res.affectedRows;
}

async function subcategoryInUse(subId, orgId) {
  // CORRECCIÓN: Tu consulta original tenía un error (orgId en lugar de p.org_id)
  const [rows] = await pool.query(
    `SELECT 1 FROM products p
     WHERE p.subcategory_id = ? AND p.org_id = ? AND p.is_deleted = 0
     LIMIT 1`,
    [subId, orgId]
  );
  return !!rows.length;
}

module.exports = {
  getCategoryAndVerifyOrg,
  getSubcategoryAndVerifyOrg,
  queryCategories,
  countCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryInUse,
  listSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  subcategoryInUse
};
