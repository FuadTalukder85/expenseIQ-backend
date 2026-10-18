import { Router } from "express";
import { Role } from "@prisma/client";
import { auth, authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { DepartmentController } from "./department.controller";
import { DepartmentValidation } from "./department.validation";

const router = Router();

router.post(
  "/",
  auth(),
  authorize(Role.ADMIN),
  validateRequest(DepartmentValidation.createDepartmentZodSchema),
  DepartmentController.createDepartment,
);

router.get("/", auth(), DepartmentController.getAllDepartments);

router.get("/:id", auth(), DepartmentController.getDepartmentById);

router.patch(
  "/:id",
  auth(),
  authorize(Role.ADMIN),
  validateRequest(DepartmentValidation.updateDepartmentZodSchema),
  DepartmentController.updateDepartment,
);

router.delete("/:id", auth(), authorize(Role.ADMIN), DepartmentController.deleteDepartment);

export const DepartmentRoutes = router;
