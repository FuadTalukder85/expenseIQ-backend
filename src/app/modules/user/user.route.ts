import { Router } from "express";
import { Role } from "@prisma/client";
import { auth, authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = Router();

router.post(
  "/",
  auth(),
  authorize(Role.ADMIN),
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser,
);

router.get("/", auth(), authorize(Role.ADMIN), UserController.getAllUsers);

router.get("/:id", auth(), UserController.getUserById);

router.patch(
  "/:id",
  auth(),
  authorize(Role.ADMIN),
  validateRequest(UserValidation.updateUserZodSchema),
  UserController.updateUser,
);

router.delete("/:id", auth(), authorize(Role.ADMIN), UserController.deleteUser);

export const UserRoutes = router;
