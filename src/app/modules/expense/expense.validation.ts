import { ExpenseStatus } from "@prisma/client";
import { z } from "zod";

const createExpenseZodSchema = z
  .object({
    categoryId: z.string({ required_error: "categoryId is required" }).trim().min(1),
    vendor: z.string({ required_error: "vendor name is required" }).trim().min(1, "Vendor name is required"),
    expenseDate: z.string({ required_error: "expenseDate is required" }).or(z.date()),
    description: z.string().optional(),
    amount: z
      .number({ required_error: "amount is required" })
      .positive("Amount must be a positive number"),
    discount: z.number().min(0, "Discount cannot be negative").default(0),
    receiptText: z.string().optional(),
  })
  .refine((data) => data.discount <= data.amount, {
    message: "Discount cannot be greater than amount",
    path: ["discount"],
  });

const updateExpenseZodSchema = z
  .object({
    categoryId: z.string().trim().min(1).optional(),
    vendor: z.string().trim().min(1).optional(),
    expenseDate: z.string().or(z.date()).optional(),
    description: z.string().optional(),
    amount: z.number().positive("Amount must be a positive number").optional(),
    discount: z.number().min(0, "Discount cannot be negative").optional(),
    receiptText: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.amount !== undefined && data.discount !== undefined) {
        return data.discount <= data.amount;
      }
      return true;
    },
    {
      message: "Discount cannot be greater than amount",
      path: ["discount"],
    },
  );

const filterExpenseQuerySchema = z.object({
  status: z.nativeEnum(ExpenseStatus).optional(),
  categoryId: z.string().optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
  scope: z.enum(["own", "reports", "all"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const ExpenseValidation = {
  createExpenseZodSchema,
  updateExpenseZodSchema,
  filterExpenseQuerySchema,
};
