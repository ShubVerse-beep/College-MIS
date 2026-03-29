const express = require("express");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const controller = require("./marks.controller");
const { upsertMarksSchema, marksListQuerySchema } = require("./marks.validation");

const router = express.Router();

router.use(protect);

router.get("/me", authorize("student"), controller.myMarks);
router.get(
  "/",
  authorize("admin", "faculty"),
  validate(marksListQuerySchema, "query"),
  controller.listMarks
);
router.post("/", authorize("admin", "faculty"), validate(upsertMarksSchema), controller.upsertMarks);

module.exports = router;
