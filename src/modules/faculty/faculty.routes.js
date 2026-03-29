const express = require("express");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const controller = require("./faculty.controller");
const {
  createFacultySchema,
  updateFacultySchema,
  facultyListQuerySchema,
  facultyIdParamSchema
} = require("./faculty.validation");

const router = express.Router();

router.use(protect);

router.get("/me", authorize("faculty"), controller.me);

router
  .route("/")
  .get(authorize("admin"), validate(facultyListQuerySchema, "query"), controller.listFaculty)
  .post(authorize("admin"), validate(createFacultySchema), controller.createFaculty);

router
  .route("/:id")
  .get(authorize("admin"), validate(facultyIdParamSchema, "params"), controller.getFaculty)
  .patch(
    authorize("admin"),
    validate(facultyIdParamSchema, "params"),
    validate(updateFacultySchema),
    controller.updateFaculty
  )
  .delete(authorize("admin"), validate(facultyIdParamSchema, "params"), controller.deleteFaculty);

module.exports = router;
