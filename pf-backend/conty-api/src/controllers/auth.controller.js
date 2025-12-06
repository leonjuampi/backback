// src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
// 1. IMPORTAR EL SERVICIO DE AUDITORÍA
const { logAction } = require('../services/audit.service');

async function login(req, res) {
  // Mover 'username' aquí para usarlo en los logs de fallo
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const [rows] = await pool.query(
      `SELECT id, username, password_hash, role_id, email, name, org_id, branch_id, status
       FROM users
       WHERE username = ? AND deleted_at IS NULL
       LIMIT 1`,
      [username]
    );
    const user = rows[0];

    // --- PUNTO DE AUDITORÍA: FALLO (Usuario no encontrado) ---
    if (!user) {
      // Registrar intento fallido (fire-and-forget, sin await)
      logAction({
        userId: null, // No sabemos quién es
        actionType: 'LOGIN_FAIL',
        details: {
          usernameAttempt: username,
          reason: 'User not found'
        }
      });
      return res.status(400).json({ message: 'User not found' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);

    // --- PUNTO DE AUDITORÍA: FALLO (Contraseña incorrecta) ---
    if (!ok) {
      // Registrar intento fallido (fire-and-forget)
      logAction({
        orgId: user.org_id || null,
        userId: user.id, // Sí sabemos quién intentó loguearse
        actionType: 'LOGIN_FAIL',
        details: {
          usernameAttempt: username,
          reason: 'Invalid credentials'
        }
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ message: 'Password not set. Complete account setup.' });
    }
    if (user.status === 'INVITED') {
      return res.status(400).json({ message: 'User invited. Must set password first.' });
    }

    // Branches asignadas via user_branches
    const [branchRows] = await pool.query(
      `SELECT b.id
         FROM user_branches ub
         JOIN branches b ON b.id = ub.branch_id AND b.is_deleted = 0
        WHERE ub.user_id = ? AND ub.is_deleted = 0`,
      [user.id]
    );
    const branchIds = branchRows.map(b => b.id);
    const activeBranchId = user.branch_id || branchIds[0] || null;

    // JWT payload con contexto
    const payload = {
      uid: user.id,
      roleId: user.role_id,
      username: user.username,
      email: user.email,
      orgId: user.org_id || null,
      branchId: activeBranchId,
      branchIds
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });

    // --- PUNTO DE AUDITORÍA: ÉXITO ---
    // Registrar login exitoso (fire-and-forget)
    logAction({
      orgId: user.org_id || null,
      userId: user.id,
      actionType: 'LOGIN_SUCCESS',
      details: { username: user.username }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        roleId: user.role_id,
        orgId: user.org_id || null,
        branchId: activeBranchId,
        branchIds
      }
    });
  } catch (e) {
    console.error('LOGIN_ERROR:', e.message);
    // Opcional: Registrar error 500 en la auditoría
    // logAction({ actionType: 'SYSTEM_ERROR', details: { context: 'Login', error: e.message } });
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login };
