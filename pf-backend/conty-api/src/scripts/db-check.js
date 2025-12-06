require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('DB OK:', rows[0]);
    process.exit(0);
  } catch (e) {
    console.error('DB FAIL:', e.message);
    process.exit(1);
  }
})();
