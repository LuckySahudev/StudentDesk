const express = require('express');
const studentController = require('../controller/studentController');

const router = express.Router();

router.get('/api/dashboard', studentController.getDashboardData);
router.get('/api/notices', studentController.getNotices);
router.get('/api/profile', studentController.getProfile);
router.put('/api/profile', studentController.updateProfile);
router.get('/api/attendance', studentController.getAttendance);
router.get('/api/fees', studentController.getFees);
router.get('/api/timetable', studentController.getTimetable);
router.get('/api/exams', studentController.getExams);
router.get('/', studentController.getPage('dashboard'));
router.get('/dashboard', studentController.getPage('dashboard'));
router.get('/profile', studentController.getPage('profile'));
router.get('/attendance', studentController.getPage('attendance'));
router.get('/fees', studentController.getPage('fees'));
router.get('/exams', studentController.getPage('exams'));
router.get('/results', studentController.getPage('results'));
router.get('/timetable', studentController.getPage('timetable'));
router.get('/notices', studentController.getPage('notices'));

module.exports = router;
