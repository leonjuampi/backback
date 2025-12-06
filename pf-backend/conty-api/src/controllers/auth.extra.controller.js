const pool = require('../config/db');
const jwt = require('jsonwebtoken');

/**
 * Reconstituye el token con el estado actual del usuario (orgId/branchId/branchIds).
 */
async function refresh(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, role_id, email, org_id, branch_id
         FROM users
        WHERE id = ? AND is_deleted = 0
        LIMIT 1`,
      [req.user.uid]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const [branchRows] = await pool.query(
      `SELECT b.id
         FROM user_branches ub
         JOIN branches b ON b.id = ub.branch_id AND b.is_deleted = 0
        WHERE ub.user_id = ? AND ub.is_deleted = 0`,
      [user.id]
    );
    const branchIds = branchRows.map(b => b.id);
    const activeBranchId = user.branch_id || branchIds[0] || null;

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

    res.json({ token, user: payload });
  } catch (e) {
    console.error('REFRESH_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Cambia la branch activa del usuario (si la tiene asignada) y devuelve un nuevo token.
 */
async function switchContext(req, res) {
  try {
    const { branchId } = req.body || {};
    const uid = req.user.uid;

    if (!branchId) return res.status(400).json({ message: 'branchId is required' });

    const [allowed] = await pool.query(
      `SELECT 1
         FROM user_branches
        WHERE user_id = ? AND branch_id = ? AND is_deleted = 0
        LIMIT 1`,
      [uid, branchId]
    );
    if (!allowed.length) {
      return res.status(403).json({ message: 'Branch not assigned to user' });
    }

    await pool.query(`UPDATE users SET branch_id = ? WHERE id = ?`, [branchId, uid]);

    const [userRow] = await pool.query(
      `SELECT id, username, role_id, email, org_id, branch_id
         FROM users
        WHERE id = ?`,
      [uid]
    );
    const user = userRow[0];

    const [branchRows] = await pool.query(
      `SELECT branch_id
         FROM user_branches
        WHERE user_id = ? AND is_deleted = 0`,
      [uid]
    );
    const branchIds = branchRows.map(b => b.branch_id);

    const payload = {
      uid: user.id,
      roleId: user.role_id,
      username: user.username,
      email: user.email,
      orgId: user.org_id || null,
      branchId,
      branchIds
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });

    res.json({ token, user: payload });
  } catch (e) {
    console.error('SWITCH_CONTEXT_ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { refresh, switchContext };
