const express = require('express');
const path = require('path');

const router = express.Router();
const studentRoutes = require('./studentRoutes');
const teacherRoutes = require('./teacherRoutes');
const adminRoutes = require('./adminRoutes');
const auth = require('../middleware/auth');

router.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../pages/login.html'));
});

router.use('/student', auth, studentRoutes);
router.use('/teacher', auth, teacherRoutes);
router.use('/admin', auth, adminRoutes);

module.exports = router;
