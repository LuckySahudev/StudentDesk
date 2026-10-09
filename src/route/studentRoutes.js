const express = require('express');
const studentController = require('../controller/studentController');

const router = express.Router();

router.get('/', studentController.getPage('dashboard'));
router.get('/dashboard', studentController.getPage('dashboard'));
router.get('/profile', studentController.getPage('profile'));
router.get('/attendance', studentController.getPage('attendance'));
router.get('/fees', studentController.getPage('fees'));
router.get('/exams', studentController.getPage('exams'));
router.get('/results', studentController.getPage('results'));
router.get('/timetable', studentController.getPage('timetable'));
router.get('/notices', studentController.getPage('notices'));
router.get('/study-material', studentController.getPage('study-material'));
router.get('/settings', studentController.getPage('settings'));

module.exports = router;
