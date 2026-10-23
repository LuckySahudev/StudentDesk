const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../database');

const accountTables = {
  student: { table: 'students', id: 'student_id' },
  teacher: { table: 'teachers', id: 'teacher_id' },
  admin: { table: 'admins', id: 'admin_id' },
};

function getRoleReturnPath(value, role) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return `/${role}`;
  try {
    const url = new URL(value, 'http://studentdesk.local');
    const roleHome = `/${role}`;
    if (url.origin !== 'http://studentdesk.local' || !(url.pathname === roleHome || url.pathname.startsWith(`${roleHome}/`))) return roleHome;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return `/${role}`;
  }
}

function sameSecret(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function verifyAndUpgradePassword(role, account, suppliedPassword) {
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(account.password);
  if (isBcryptHash) return bcrypt.compare(suppliedPassword, account.password);

  // Upgrade legacy plaintext credentials on the first successful login.
  if (!sameSecret(account.password, suppliedPassword)) return false;
  const hash = await bcrypt.hash(suppliedPassword, 12);
  const { table, id } = accountTables[role];
  await pool.query(`UPDATE public.${table} SET password = $1 WHERE ${id} = $2 AND password = $3`, [hash, account.id, account.password]);
  return true;
}

async function findAccount(role, id) {
  const queries = {
    student: `SELECT s.student_id AS id, s.password, s.first_name, s.last_name
              FROM public.students s WHERE s.student_id = $1 LIMIT 1`,
    teacher: `SELECT t.teacher_id AS id, t.password, e.first_name, e.last_name
              FROM public.teachers t JOIN public.employees e ON e.employee_id = t.employee_id
              WHERE t.teacher_id = $1 LIMIT 1`,
    admin: `SELECT a.admin_id AS id, a.password, e.first_name, e.last_name
            FROM public.admins a JOIN public.employees e ON e.employee_id = a.employee_id
            WHERE a.admin_id = $1 LIMIT 1`,
  };
  const result = await pool.query(queries[role], [id]);
  return result.rows[0];
}

exports.login = async (req, res) => {
  const body = req.body || {};
  const role = String(body.role || '').toLowerCase();
  const rawId = String(body.userId || '').trim();
  const password = body.password;
  const id = /^\d+$/.test(rawId) ? Number(rawId) : NaN;

  if (!accountTables[role] || !Number.isSafeInteger(id) || id < 1 || typeof password !== 'string' || !password || password.length > 200) {
    return res.status(400).json({ error: 'Choose a role and enter a valid ID and password.' });
  }

  try {
    const account = await findAccount(role, id);
    if (!account || typeof account.password !== 'string' || !account.password) {
      return res.status(401).json({ error: 'Invalid role, ID, or password.' });
    }

    if (!(await verifyAndUpgradePassword(role, account, password))) {
      return res.status(401).json({ error: 'Invalid role, ID, or password.' });
    }

    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
    req.session.user = {
      id: account.id,
      role,
      name: [account.first_name, account.last_name].filter(Boolean).join(' ') || `${role[0].toUpperCase()}${role.slice(1)} ${account.id}`,
    };
    req.session.cookie.maxAge = body.remember === true ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
    const safeReturnTo = getRoleReturnPath(body.returnTo, role);
    return res.json({ user: req.session.user, redirect: safeReturnTo });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(503).json({ error: 'Login is temporarily unavailable.' });
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('studentdesk.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.sendStatus(204);
  });
};

exports.currentUser = (req, res) => {
  res.json({ user: req.session.user });
};
