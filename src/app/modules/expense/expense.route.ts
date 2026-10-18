import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { ExpenseController } from "./expense.controller";
import { ExpenseValidation } from "./expense.validation";

const router = Router();

router.post(
  "/",
  auth(),
  validateRequest(ExpenseValidation.createExpenseZodSchema),
  ExpenseController.createDraftExpense,
);

router.get(
  "/",
  auth(),
  validateRequest(ExpenseValidation.filterExpenseQuerySchema, "query"),
  ExpenseController.getExpenses,
);

router.get("/:id", auth(), ExpenseController.getExpenseById);

router.patch(
  "/:id",
  auth(),
  validateRequest(ExpenseValidation.updateExpenseZodSchema),
  ExpenseController.updateDraftExpense,
);

router.delete("/:id", auth(), ExpenseController.deleteDraftExpense);

export const ExpenseRoutes = router;
