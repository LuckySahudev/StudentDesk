const express = require("express");
const router = express.Router();
const controller = require('../controller/stController');


router.get("/", controller.getStudents);
router.get("/:id", controller.getStudents);
router.post("/",controller.postStudents);
router.put("/:id",controller.putStuedents);
router.patch("/:id",controller.patchStudents);
router.delete("/:id",controller.deleteStudents);


module.exports = router;