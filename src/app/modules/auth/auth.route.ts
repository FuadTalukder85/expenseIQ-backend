import { Router } from "express";
import { Role } from "@prisma/client";
import { auth, authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post("/login", validateRequest(AuthValidation.loginSchema), AuthController.loginUser);

router.post(
  "/register",
  auth(),
  authorize(Role.ADMIN),
  validateRequest(AuthValidation.registerSchema),
  AuthController.registerUser,
);

router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;
