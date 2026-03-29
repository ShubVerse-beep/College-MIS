const express = require("express");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const controller = require("./timetable.controller");
const {
  createTimetableSchema,
  updateTimetableSchema,
  timetableListQuerySchema,
  timetableIdParamSchema
} = require("./timetable.validation");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(validate(timetableListQuerySchema, "query"), controller.listTimetables)
  .post(authorize("admin"), validate(createTimetableSchema), controller.createTimetable);

router
  .route("/:id")
  .get(validate(timetableIdParamSchema, "params"), controller.getTimetable)
  .patch(
    authorize("admin"),
    validate(timetableIdParamSchema, "params"),
    validate(updateTimetableSchema),
    controller.updateTimetable
  )
  .delete(authorize("admin"), validate(timetableIdParamSchema, "params"), controller.deleteTimetable);

router.post(
  "/:id/publish",
  authorize("admin"),
  validate(timetableIdParamSchema, "params"),
  controller.publishTimetable
);

module.exports = router;

