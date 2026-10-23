const express = require('express');
const adminController = require('../controller/adminController');

const router = express.Router();

router.get('/', adminController.getPage('dashboard'));
router.get('/dashboard', adminController.getPage('dashboard'));
router.get('/students', adminController.getPage('students'));
router.get('/api/students', adminController.getStudents);
router.post('/api/students', adminController.saveStudent);
router.put('/api/students/:id', adminController.saveStudent);
router.get('/teachers', adminController.getPage('teachers'));
router.get('/attendance', adminController.getPage('attendance'));
router.get('/classes', adminController.getPage('classes'));
router.get('/fees', adminController.getPage('fees'));
router.get('/exams', adminController.getPage('exams'));
router.get('/results', adminController.getPage('results'));
router.get('/notices', adminController.getPage('notices'));
router.get('/timetable', adminController.getPage('timetable'));
router.get('/analytics', adminController.getPage('analytics'));
router.get('/settings', adminController.getPage('settings'));

module.exports = router;
