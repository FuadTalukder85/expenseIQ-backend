import status from "http-status";
import { ExpenseStatus, Role } from "@prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IAuthUser } from "../../types/express";
import { calculateExpenseAmounts } from "./expense.calculation";

const createDraftExpense = async (
  user: IAuthUser,
  payload: {
    categoryId: string;
    vendor: string;
    expenseDate: string | Date;
    description?: string;
    amount: number;
    discount?: number;
    receiptText?: string;
  },
) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(status.NOT_FOUND, "Expense category not found");
  }

  // Get employee's current departmentId
  const employee = await prisma.user.findUnique({
    where: { id: user.id },
    select: { departmentId: true },
  });

  if (!employee) {
    throw new AppError(status.NOT_FOUND, "Employee profile not found");
  }

  const { amount, discount, taxRate, taxAmount, netAmount } = calculateExpenseAmounts({
    amount: payload.amount,
    discount: payload.discount,
    taxRate: Number(category.taxRate),
  });

  const expense = await prisma.expense.create({
    data: {
      employeeId: user.id,
      departmentId: employee.departmentId,
      categoryId: payload.categoryId,
      vendor: payload.vendor.trim(),
      expenseDate: new Date(payload.expenseDate),
      description: payload.description?.trim() || null,
      amount,
      discount,
      taxRate,
      taxAmount,
      netAmount,
      status: ExpenseStatus.DRAFT,
      receiptText: payload.receiptText || null,
    },
    include: {
      category: { select: { id: true, name: true, taxRate: true } },
      department: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return expense;
};

const getExpenses = async (
  user: IAuthUser,
  query: {
    status?: ExpenseStatus;
    categoryId?: string;
    departmentId?: string;
    search?: string;
    scope?: "own" | "reports" | "all";
    page?: number;
    limit?: number;
  },
) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  const whereConditions: Record<string, unknown> = {};

  // Status, Category, Department filters
  if (query.status) {
    whereConditions.status = query.status;
  }
  if (query.categoryId) {
    whereConditions.categoryId = query.categoryId;
  }
  if (query.departmentId) {
    whereConditions.departmentId = query.departmentId;
  }

  // Search filter
  if (query.search) {
    whereConditions.OR = [
      { vendor: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  // Role-based visibility and scope logic
  if (user.role === Role.EMPLOYEE) {
    whereConditions.employeeId = user.id;
  } else if (user.role === Role.MANAGER) {
    if (query.scope === "own") {
      whereConditions.employeeId = user.id;
    } else if (query.scope === "reports") {
      whereConditions.employee = { managerId: user.id };
    } else {
      // Default for manager: own + direct reports
      whereConditions.OR = [
        { employeeId: user.id },
        { employee: { managerId: user.id } },
      ];
    }
  } else if (user.role === Role.DEPT_HEAD) {
    if (query.scope === "own") {
      whereConditions.employeeId = user.id;
    } else {
      // Dept head can view department expenses
      whereConditions.departmentId = user.departmentId;
    }
  }
  // FINANCE and ADMIN can see all expenses

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, taxRate: true } },
        department: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.expense.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: expenses,
  };
};

const getExpenseById = async (user: IAuthUser, id: string) => {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, taxRate: true } },
      department: { select: { id: true, name: true } },
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          managerId: true,
          departmentId: true,
        },
      },
      approvals: {
        include: {
          approver: { select: { id: true, name: true, role: true } },
        },
        orderBy: { decidedAt: "asc" },
      },
    },
  });

  if (!expense) {
    throw new AppError(status.NOT_FOUND, "Expense not found");
  }

  // Business Rule: "Accessing another user's expense returns 403"
  if (user.role === Role.EMPLOYEE && expense.employeeId !== user.id) {
    throw new AppError(status.FORBIDDEN, "Forbidden: You do not have permission to access this expense");
  }

  if (user.role === Role.MANAGER) {
    const isOwner = expense.employeeId === user.id;
    const isManagerOfOwner = expense.employee.managerId === user.id;
    if (!isOwner && !isManagerOfOwner) {
      throw new AppError(status.FORBIDDEN, "Forbidden: You do not have permission to access this expense");
    }
  }

  if (user.role === Role.DEPT_HEAD) {
    const isOwner = expense.employeeId === user.id;
    const isSameDepartment = expense.departmentId === user.departmentId;
    if (!isOwner && !isSameDepartment) {
      throw new AppError(status.FORBIDDEN, "Forbidden: You do not have permission to access this expense");
    }
  }

  return expense;
};

const updateDraftExpense = async (
  user: IAuthUser,
  id: string,
  payload: {
    categoryId?: string;
    vendor?: string;
    expenseDate?: string | Date;
    description?: string;
    amount?: number;
    discount?: number;
    receiptText?: string;
  },
) => {
  const existing = await prisma.expense.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!existing) {
    throw new AppError(status.NOT_FOUND, "Expense not found");
  }

  // Business Rule: "Accessing another user's expense returns 403"
  if (existing.employeeId !== user.id) {
    throw new AppError(status.FORBIDDEN, "Forbidden: You can only edit your own expenses");
  }

  // Business Rule: "Non-DRAFT expense cannot be edited or deleted"
  if (existing.status !== ExpenseStatus.DRAFT) {
    throw new AppError(status.BAD_REQUEST, "Non-DRAFT expense cannot be edited or deleted");
  }

  // Handle amount and tax calculation updates
  let amount = Number(existing.amount);
  let discount = Number(existing.discount);
  let taxRate = Number(existing.taxRate);

  if (payload.categoryId && payload.categoryId !== existing.categoryId) {
    const newCategory = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!newCategory) {
      throw new AppError(status.NOT_FOUND, "Specified category not found");
    }
    taxRate = Number(newCategory.taxRate);
  }

  if (payload.amount !== undefined) {
    amount = payload.amount;
  }

  if (payload.discount !== undefined) {
    discount = payload.discount;
  }

  const calculated = calculateExpenseAmounts({ amount, discount, taxRate });

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(payload.categoryId && { categoryId: payload.categoryId }),
      ...(payload.vendor && { vendor: payload.vendor.trim() }),
      ...(payload.expenseDate && { expenseDate: new Date(payload.expenseDate) }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || null }),
      ...(payload.receiptText !== undefined && { receiptText: payload.receiptText || null }),
      amount: calculated.amount,
      discount: calculated.discount,
      taxRate: calculated.taxRate,
      taxAmount: calculated.taxAmount,
      netAmount: calculated.netAmount,
    },
    include: {
      category: { select: { id: true, name: true, taxRate: true } },
      department: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return updated;
};

const deleteDraftExpense = async (user: IAuthUser, id: string) => {
  const existing = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(status.NOT_FOUND, "Expense not found");
  }

  // Business Rule: "Accessing another user's expense returns 403"
  if (existing.employeeId !== user.id && user.role !== Role.ADMIN) {
    throw new AppError(status.FORBIDDEN, "Forbidden: You can only delete your own draft expenses");
  }

  // Business Rule: "Non-DRAFT expense cannot be edited or deleted"
  if (existing.status !== ExpenseStatus.DRAFT) {
    throw new AppError(status.BAD_REQUEST, "Non-DRAFT expense cannot be edited or deleted");
  }

  await prisma.expense.delete({
    where: { id },
  });

  return { message: "Draft expense deleted successfully" };
};

export const ExpenseService = {
  createDraftExpense,
  getExpenses,
  getExpenseById,
  updateDraftExpense,
  deleteDraftExpense,
};
