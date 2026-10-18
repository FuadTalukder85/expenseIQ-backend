import { Request, Response } from "express";
import status from "http-status";
import { ExpenseStatus } from "@prisma/client";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { IAuthUser } from "../../types/express";
import { ExpenseService } from "./expense.service";

const createDraftExpense = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await ExpenseService.createDraftExpense(user, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Expense draft created successfully",
    data: result,
  });
});

const getExpenses = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const query = {
    status: req.query.status as ExpenseStatus | undefined,
    categoryId: req.query.categoryId as string | undefined,
    departmentId: req.query.departmentId as string | undefined,
    search: req.query.search as string | undefined,
    scope: req.query.scope as "own" | "reports" | "all" | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  };

  const result = await ExpenseService.getExpenses(user, query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Expenses retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getExpenseById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await ExpenseService.getExpenseById(user, req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Expense details retrieved successfully",
    data: result,
  });
});

const updateDraftExpense = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await ExpenseService.updateDraftExpense(user, req.params.id as string, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Draft expense updated successfully",
    data: result,
  });
});

const deleteDraftExpense = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const result = await ExpenseService.deleteDraftExpense(user, req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Draft expense deleted successfully",
    data: result,
  });
});

export const ExpenseController = {
  createDraftExpense,
  getExpenses,
  getExpenseById,
  updateDraftExpense,
  deleteDraftExpense,
};
