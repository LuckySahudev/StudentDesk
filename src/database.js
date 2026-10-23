const { Pool } = require('pg');

if (!process.env.DB_Connection_String) {
  throw new Error('DB_Connection_String is not set in the environment.');
}

const pool = new Pool({
  connectionString: process.env.DB_Connection_String,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = pool;
