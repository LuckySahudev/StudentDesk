const express = require("express");
const router = express.Router();
const path = require('path');
const adminController = require(path.resolve(__dirname,'../controller/adminController'));
const studentController = require(path.resolve(__dirname,'../controller/studentController'));
const teacherController = require(path.resolve(__dirname,'../controller/teacherController'));

router.
    get('/login', (req, res) => res.sendFile(path.resolve(__dirname, '../pages/login.html')))
    .get('/login/', (req, res) => res.sendFile(path.resolve(__dirname, '../pages/login.html')))
    .get('/admin', adminController.getpage)
    .get('/admin/', adminController.getpage)
    .get('/admin/:page', adminController.getpage)
    .get('/student', studentController.getpage)
    .get('/student/', studentController.getpage)
    .get('/student/:page', studentController.getpage)
    .get('/teacher', teacherController.getpage)
    .get('/teacher/', teacherController.getpage)
    .get('/teacher/:page', teacherController.getpage);



module.exports = router;
