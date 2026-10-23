require("dotenv").config();
const express = require('express');
const server = express();
const path = require('path');
const pool = require('./src/database');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const router = require(
    path.resolve(__dirname,'./src/route/route.js')
);


if (process.env.NODE_ENV === 'production') server.set('trust proxy', 1);
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
const sessionSecret = process.env.AUTH_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : require('crypto').randomBytes(48).toString('hex'));
if (!sessionSecret) throw new Error('AUTH_SESSION_SECRET must be set in production.');
server.use(session({
  name: 'studentdesk.sid',
  secret: sessionSecret,
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));
server.use(express.static(path.join(__dirname,'./public')));
const requireAuth = require('./src/middleware/requireAuth');
server.get('/api/db/tables', requireAuth('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_schema, table_name,
             json_agg(json_build_object('name', column_name, 'type', data_type)
                      ORDER BY ordinal_position) AS columns
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      GROUP BY table_schema, table_name
      ORDER BY table_schema, table_name
    `);
    res.json({ database: result.rows });
  } catch (error) {
    console.error('Unable to read database schema:', error.message);
    res.status(503).json({ error: 'Database schema is unavailable.' });
  }
});
server.use('/',router);



 




server.listen(8080, async () => {
  console.log('Server is on at http://localhost:8080');
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL is connected.');
  } catch (error) {
    console.error('PostgreSQL is unavailable:', error.message);
  }
});
