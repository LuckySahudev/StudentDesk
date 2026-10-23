const express = require('express');
const path = require('path');

const router = express.Router();
const studentRoutes = require('./studentRoutes');
const teacherRoutes = require('./teacherRoutes');
const adminRoutes = require('./adminRoutes');
const requireAuth = require('../middleware/requireAuth');
const loginRateLimit = require('../middleware/loginRateLimit');
const authController = require('../controller/authController');

router.get('/login', (req, res) => {
  const switchingAccount = req.query.switch === '1';
  if (req.session?.user && !switchingAccount) {
    const roleHome = `/${req.session.user.role}`;
    const next = typeof req.query.next === 'string' ? req.query.next : '';
    if (next.startsWith(`${roleHome}/`) && !next.startsWith('//') && !next.includes('\\')) {
      try {
        const target = new URL(next, 'http://studentdesk.local');
        if (target.origin === 'http://studentdesk.local' && (target.pathname === roleHome || target.pathname.startsWith(`${roleHome}/`))) {
          return res.redirect(`${target.pathname}${target.search}${target.hash}`);
        }
      } catch {
        // Invalid return paths fall back to the signed-in user's dashboard.
      }
    }
    if (next === roleHome) return res.redirect(roleHome);
    return res.redirect(roleHome);
  }
  res.sendFile(path.resolve(__dirname, '../pages/login.html'));
});
router.post('/api/auth/login', loginRateLimit, authController.login);
router.post('/api/auth/logout', authController.logout);
router.get('/api/auth/me', requireAuth(), authController.currentUser);

router.use('/student', requireAuth('student'), studentRoutes);
router.use('/teacher', requireAuth('teacher'), teacherRoutes);
router.use('/admin', requireAuth('admin'), adminRoutes);

module.exports = router;
