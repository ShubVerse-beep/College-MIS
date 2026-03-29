const express = require("express");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const controller = require("./course.controller");
const {
  createCourseSchema,
  updateCourseSchema,
  courseListQuerySchema,
  courseIdParamSchema
} = require("./course.validation");

const router = express.Router();

router.use(protect);

router.get("/assigned", authorize("faculty"), controller.assignedCourses);
router.get("/my", authorize("student"), controller.myCourses);

router
  .route("/")
  .get(authorize("admin"), validate(courseListQuerySchema, "query"), controller.listCourses)
  .post(authorize("admin"), validate(createCourseSchema), controller.createCourse);

router
  .route("/:id")
  .get(authorize("admin"), validate(courseIdParamSchema, "params"), controller.getCourse)
  .patch(
    authorize("admin"),
    validate(courseIdParamSchema, "params"),
    validate(updateCourseSchema),
    controller.updateCourse
  )
  .delete(authorize("admin"), validate(courseIdParamSchema, "params"), controller.deleteCourse);

module.exports = router;
