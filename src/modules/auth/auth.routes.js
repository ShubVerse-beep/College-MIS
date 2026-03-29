const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const controller = require("./auth.controller");
const {
  bootstrapAdminSchema,
  loginSchema,
  changePasswordSchema
} = require("./auth.validation");

const router = express.Router();

router.get("/bootstrap-status", controller.getBootstrapStatus);
router.post("/bootstrap-admin", validate(bootstrapAdminSchema), controller.bootstrapAdmin);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", protect, controller.logout);
router.get("/me", protect, controller.me);
router.patch(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  controller.changePassword
);

module.exports = router;
