// src/config/db.js
const mysql = require('mysql2/promise');

const b64ConnectionString = process.env.DB_CONNECTION_STRING_B64;

if (!b64ConnectionString) {
  throw new Error('DB_CONNECTION_STRING_B64 no está definida en el archivo .env');
}

const connectionString = Buffer.from(b64ConnectionString, 'base64').toString('utf-8');

const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('[DB] Conexión a la base de datos establecida exitosamente.');
    connection.release();
  } catch (err) {
    console.error('[DB] ERROR al conectar con la base de datos:', err.code || err.message);
    process.exit(1);
  }
})();

module.exports = pool;
