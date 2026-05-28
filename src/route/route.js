const express = require("express");
const router = express.Router();
const path = require('path');
const adminController = require(path.resolve(__dirname,'../controller/adminController'));
const studentController = require(path.resolve(__dirname,'../controller/studentController'));
const teacherController = require(path.resolve(__dirname,'../controller/teacherController'));

router.
    get('/admin/',adminController.getpage)
    .get('/student/',studentController.getpage)
    .get('/teacher/',teacherController.getpage);



module.exports = router;