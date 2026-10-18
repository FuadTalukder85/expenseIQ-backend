import { Router } from "express";
import { Role } from "@prisma/client";
import { auth, authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";

const router = Router();

router.post(
  "/",
  auth(),
  authorize(Role.ADMIN),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory,
);

router.get("/", auth(), CategoryController.getAllCategories);

router.get("/:id", auth(), CategoryController.getCategoryById);

router.patch(
  "/:id",
  auth(),
  authorize(Role.ADMIN),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory,
);

router.delete("/:id", auth(), authorize(Role.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;
