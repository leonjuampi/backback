const pool = require('../config/db');

async function findUserByUsername(username) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? AND deleted_at IS NULL LIMIT 1',
    [username]
  );
  return rows[0];
}

module.exports = { findUserByUsername };
