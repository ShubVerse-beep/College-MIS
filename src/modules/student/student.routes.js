const express = require("express");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const controller = require("./student.controller");
const {
  createStudentSchema,
  updateStudentSchema,
  studentListQuerySchema,
  studentIdParamSchema,
  studentSelfUpdateSchema,
  assignedStudentsQuerySchema
} = require("./student.validation");

const router = express.Router();

router.use(protect);

router.get("/me", authorize("student"), controller.me);
router.patch("/me", authorize("student"), validate(studentSelfUpdateSchema), controller.updateMe);
router.get(
  "/assigned",
  authorize("faculty"),
  validate(assignedStudentsQuerySchema, "query"),
  controller.assignedStudents
);

router
  .route("/")
  .get(authorize("admin"), validate(studentListQuerySchema, "query"), controller.listStudents)
  .post(authorize("admin"), validate(createStudentSchema), controller.createStudent);

router
  .route("/:id")
  .get(authorize("admin"), validate(studentIdParamSchema, "params"), controller.getStudent)
  .patch(
    authorize("admin"),
    validate(studentIdParamSchema, "params"),
    validate(updateStudentSchema),
    controller.updateStudent
  )
  .delete(authorize("admin"), validate(studentIdParamSchema, "params"), controller.deleteStudent);

module.exports = router;
