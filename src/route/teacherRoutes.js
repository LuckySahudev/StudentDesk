const express = require('express');
const teacherController = require('../controller/teacherController');

const router = express.Router();

router.get('/', teacherController.getPage('dashboard'));
router.get('/dashboard', teacherController.getPage('dashboard'));
router.get('/profile', teacherController.getPage('profile'));
router.get('/my-classes', teacherController.getPage('my-classes'));
router.get('/students', teacherController.getPage('students'));
router.get('/attendance', teacherController.getPage('attendance'));
router.get('/exams', teacherController.getPage('exams'));
router.get('/results', teacherController.getPage('results'));
router.get('/study-material', teacherController.getPage('study-material'));
router.get('/timetable', teacherController.getPage('timetable'));
router.get('/notices', teacherController.getPage('notices'));
router.get('/settings', teacherController.getPage('settings'));

module.exports = router;
