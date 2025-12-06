// src/services/user.service.js
const dayjs = require('dayjs');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../utils/token.util');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('./audit.service');

async function findByUsername(username) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0];
}

async function createUser({ name, email, username, passwordHash, roleId, orgId = null, branchId = null, createdBy }) {
  const sql = `
    INSERT INTO users (name, email, username, password_hash, role_id, org_id, branch_id, status, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), ?)
  `;
  const [res] = await pool.query(sql, [name, email, username, passwordHash, roleId, orgId, branchId, createdBy || null]);
  const userId = res.insertId;

  // --- PUNTO DE AUDITORÍA: CREAR USUARIO (vía registerUser) ---
  logAction({
    orgId: orgId,
    userId: createdBy, // Quién hizo la acción
    actionType: 'CREATE',
    entityType: 'USER',
    entityId: userId, // El usuario creado
    details: { username: username, roleId: roleId, context: 'RegisterUser' }
  });

  return userId;
}

/** Crea usuario INVITED + token (para set-password) */
async function inviteUser({
  name, email, username, roleId = 2, orgId = null, branchId = null, branches = [], createdBy = null
}) {
  const token = generateToken(32);
  const expires = dayjs().add(Number(process.env.TOKEN_TTL_HOURS || 48), 'hour').toDate();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO users (name, email, username, password_hash, role_id, org_id, branch_id, status, password_set_token, password_set_expires, created_at, created_by)
       VALUES (?, ?, ?, '', ?, ?, ?, 'INVITED', ?, ?, NOW(), ?)`,
      [name, email, username, roleId, orgId, branchId, token, expires, createdBy]
    );
    const userId = result.insertId;

    if (Array.isArray(branches) && branches.length) {
      await setUserBranches(userId, branches, conn);
    }

    await conn.commit();

    // --- PUNTO DE AUDITORÍA: INVITAR USUARIO ---
    logAction({
      orgId: orgId,
      userId: createdBy, // Quién hizo la acción
      actionType: 'INVITE_USER',
      entityType: 'USER',
      entityId: userId, // El usuario invitado
      details: { username: username, email: email, roleId: roleId }
    });

    return { id: userId, token, expires };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** Buscar usuario por id (info mínima para validaciones) */
async function getUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, role_id AS roleId, org_id AS orgId FROM users WHERE id = ? AND is_deleted = 0 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/** Buscar por token de invitación (validación previa en /check-token) */
async function getUserBySetToken(token) {
  const [rows] = await pool.query(
    `SELECT id, email, username, password_set_expires, org_id
       FROM users
      WHERE password_set_token = ? AND status IN ('INVITED','ACTIVE')
      LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

/** Completar seteo de contraseña (activar usuario) */
async function completePasswordSetup(token, plainPassword) {
  const [rows] = await pool.query(
    `SELECT id, org_id, username, password_set_expires
       FROM users
      WHERE password_set_token = ? LIMIT 1`,
    [token]
  );
  const user = rows[0];
  if (!user) throw new Error('INVALID_TOKEN');
  if (new Date(user.password_set_expires) < new Date()) throw new Error('TOKEN_EXPIRED');

  const hash = await bcrypt.hash(plainPassword, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  await pool.query(
    `UPDATE users
        SET password_hash = ?, password_set_token = NULL, password_set_expires = NULL,
            email_verified = 1, status = 'ACTIVE'
      WHERE id = ?`,
    [hash, user.id]
  );

  // --- PUNTO DE AUDITORÍA: SETEAR CONTRASEÑA (Activación) ---
  logAction({
      orgId: user.org_id,
      userId: user.id, // El usuario que se está activando
      actionType: 'SET_PASSWORD',
      entityType: 'USER',
      entityId: user.id,
      details: { username: user.username, context: 'Invitation activation' }
  });

  return { userId: user.id };
}

/** Forgot password: genera token y fecha (idempotente, no revela existencia) */
async function issueResetToken(email) {
  const token = generateToken(32);
  const expires = dayjs().add(Number(process.env.TOKEN_TTL_HOURS || 48), 'hour').toDate();

  const [result] = await pool.query(
    `UPDATE users
        SET reset_password_token = ?, reset_password_expires = ?
      WHERE email = ? AND is_deleted = 0 AND status = 'ACTIVE'
      LIMIT 1`,
    [token, expires, email]
  );

  // Solo auditamos si encontramos un usuario y generamos el token
  if (result.affectedRows > 0) {
    // --- PUNTO DE AUDITORÍA: SOLICITUD DE RESETEO ---
    // Hacemos esta consulta extra para obtener el ID y la Org del usuario
    const [userRows] = await pool.query('SELECT id, org_id, username FROM users WHERE email = ? LIMIT 1', [email]);
    if (userRows[0]) {
        logAction({
            orgId: userRows[0].org_id,
            userId: userRows[0].id,
            actionType: 'RESET_PASSWORD',
            entityType: 'USER',
            entityId: userRows[0].id,
            details: { context: 'Password reset requested' }
        });
    }
    return { token, expires };
  }

  return null;
}

async function getUserByResetToken(token) {
  const [rows] = await pool.query(
    `SELECT id, email, username, reset_password_expires, org_id
       FROM users
      WHERE reset_password_token = ?
      LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

async function completePasswordReset(token, plainPassword) {
  const [rows] = await pool.query(
    `SELECT id, org_id, username, reset_password_expires
       FROM users
      WHERE reset_password_token = ?
      LIMIT 1`,
    [token]
  );
  const user = rows[0];
  if (!user) throw new Error('INVALID_TOKEN');
  if (new Date(user.reset_password_expires) < new Date()) throw new Error('TOKEN_EXPIRED');

  const hash = await bcrypt.hash(plainPassword, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  await pool.query(
    `UPDATE users
        SET password_hash = ?,
            reset_password_token = NULL,
            reset_password_expires = NULL,
            status = 'ACTIVE',
            email_verified = 1
      WHERE id = ?`,
    [hash, user.id]
  );

  // --- PUNTO DE AUDITORÍA: COMPLETAR RESETEO DE CONTRASEÑA ---
  logAction({
      orgId: user.org_id,
      userId: user.id, // El usuario que está reseteando
      actionType: 'SET_PASSWORD', // Usamos el mismo tipo que la activación
      entityType: 'USER',
      entityId: user.id,
      details: { username: user.username, context: 'Password reset completed' }
  });

  return { userId: user.id };
}

/** Lista sucursales activas asignadas al usuario */
async function getUserBranches(userId) {
  const [rows] = await pool.query(
    `SELECT b.id, b.org_id AS orgId, b.name, b.address, b.phone
       FROM user_branches ub
       JOIN branches b ON b.id = ub.branch_id AND b.is_deleted = 0
      WHERE ub.user_id = ? AND ub.is_deleted = 0
      ORDER BY b.name ASC`,
    [userId]
  );
  return rows;
}

/** Reemplaza asignaciones de sucursales de un usuario (soft delete friendly) */
async function setUserBranches(userId, branchIds, connOpt) {
  const conn = connOpt || (await pool.getConnection());
  const release = !connOpt;
  try {
    // --- Lógica de transacción (sin cambios) ---
    if (!connOpt) await conn.beginTransaction();

    const ids = (branchIds || []).map(n => Number(n)).filter(Boolean);
    if (!ids.length) {
      await conn.query(
        `UPDATE user_branches SET is_deleted = 1, deleted_at = NOW()
         WHERE user_id = ? AND is_deleted = 0`,
        [userId]
      );
    } else {
        await conn.query(
          `UPDATE user_branches
             SET is_deleted = 0, deleted_at = NULL
           WHERE user_id = ?
             AND branch_id IN (${ids.map(() => '?').join(',')})
             AND is_deleted = 1`,
          [userId, ...ids]
        );

        await conn.query(
          `INSERT IGNORE INTO user_branches (user_id, branch_id, is_deleted)
           VALUES ${ids.map(() => '(?, ?, 0)').join(',')}`,
          ids.flatMap(bid => [userId, bid])
        );

        await conn.query(
          `UPDATE user_branches
             SET is_deleted = 1, deleted_at = NOW()
           WHERE user_id = ?
             AND is_deleted = 0
             AND branch_id NOT IN (${ids.map(() => '?').join(',')})`,
          [userId, ...ids]
        );
    }

    if (!connOpt) await conn.commit();
    // --- FIN Lógica de transacción ---

  } catch(e) {
      if (!connOpt) await conn.rollback();
      throw e;
  } finally {
    if (release) conn.release();
  }

  // --- PUNTO DE AUDITORÍA: ACTUALIZAR SUCURSALES DE USUARIO ---
  // Se audita fuera de la transacción principal
  logAction({
      // No podemos obtener orgId/userId fácilmente aquí sin otra consulta
      // Lo ideal sería pasar 'auditingUser' (quién hizo el cambio)
      actionType: 'UPDATE',
      entityType: 'USER_BRANCHES',
      entityId: userId, // El usuario que fue modificado
      details: { assignedBranchIds: branchIds }
  });
}

async function listUsers({ orgId, search, limit = 50, offset = 0 }) {
  const wh = ['u.is_deleted = 0', 'u.org_id = ?'];
  const params = [orgId];

  if (search) {
    wh.push('(u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const where = `WHERE ${wh.join(' AND ')}`;

  // Obtenemos usuarios y sus roles (asumiendo tabla roles o hardcoded)
  const sql = `
    SELECT u.id, u.name, u.email, u.username, u.role_id as roleId, u.status, u.created_at as createdAt
    FROM users u
    ${where}
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(sql, [...params, Number(limit), Number(offset)]);
  const [cnt] = await pool.query(`SELECT COUNT(*) as total FROM users u ${where}`, params);

  return { items: rows, total: cnt[0].total };
}


module.exports = {
  findByUsername,
  createUser,
  inviteUser,
  getUserById,
  getUserBySetToken,
  completePasswordSetup,
  issueResetToken,
  getUserByResetToken,
  completePasswordReset,
  getUserBranches,
  setUserBranches,
  listUsers,
};
