const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const controller = require("./dashboard.controller");

const router = express.Router();

router.use(protect);
router.get("/summary", controller.summary);

module.exports = router;

